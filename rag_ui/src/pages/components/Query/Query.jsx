import { Box, Spinner, Text, InputGroup, Input } from "@chakra-ui/react";
import { useRef, useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import styles from "./Query.module.scss";
import AnimatedResponseText from "./AnimatedResponseText";
import { SPINNER_THICKNESS, ANIMATION_DELAY } from "@config";
import { API_ENDPOINTS } from "@apiConfig";

const Query = () => {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Clear error on input change
  useEffect(() => {
    if (error && query) setError("");
  }, [error, query]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setError("");
    setResponse("");
  };

  const executeQuery = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch(API_ENDPOINTS.QUERY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: searchQuery }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to fetch response.";

        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            errorMessage = await res.text();
          }
        } catch {
          // If parsing fails, use status-based error messages
          switch (res.status) {
            case 400:
              errorMessage = "Invalid query. Please provide a valid question.";
              break;
            case 408:
              errorMessage =
                "Query timeout. Please try a shorter or simpler question.";
              break;
            case 503:
              errorMessage =
                "Service temporarily unavailable. Please try again later.";
              break;
            case 500:
              errorMessage = "Server error occurred. Please try again later.";
              break;
            default:
              errorMessage = `Query failed (Error ${res.status}). Please try again.`;
          }
        }

        throw new Error(errorMessage);
      }

      const { answer = "" } = (await res.json()) || { answer: "" };
      setResponse(answer);
    } catch (err) {
      console.log("Error fetching response:", err);

      // Handle different types of errors
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else if (err.name === "AbortError") {
        setError("Query was cancelled or timed out. Please try again.");
      } else {
        setError(err.message || "Failed to fetch response.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeQuery(query);
  };

  return (
    <div className={styles["query-gradient-bg"]}>
      <Box className={styles.container}>
        <form
          className={styles.bigSearch}
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          <InputGroup
            className={styles.searchInputGroup}
            endElement={
              <LuSearch className="end_element" onClick={handleSubmit} />
            }
          >
            <Input
              ref={inputRef}
              className={styles.glowInput}
              type="text"
              placeholder="Query from ingested documents"
              value={query}
              onChange={handleInputChange}
              disabled={loading}
              variant="unstyled"
            />
          </InputGroup>
        </form>

        {query &&
          (error ? (
            <Box className={styles.responseBox}>
              <Text
                color="red.400"
                fontWeight="bold"
                textAlign="center"
                p="4"
                bg="red.50"
                borderRadius="lg"
                border="1px solid"
                borderColor="red.200"
                w="100%"
              >
                {error}
              </Text>
            </Box>
          ) : loading ? (
            <Box className={styles.spinnerBox}>
              <Spinner
                size="lg"
                color="teal.400"
                thickness={SPINNER_THICKNESS}
              />
            </Box>
          ) : response ? (
            <Box className={styles.responseBox}>
              <AnimatedResponseText text={response} delay={ANIMATION_DELAY} />
            </Box>
          ) : null)}
      </Box>
    </div>
  );
};

export default Query;
