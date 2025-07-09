import { Box, Container, Spinner } from "@chakra-ui/react";
import { useRef, useEffect, useState } from "react";
import styles from "./Query.module.scss";
import AnimatedResponseText from "./AnimatedResponseText";
import { SPINNER_THICKNESS, DEBOUNCE_MS, ANIMATION_DELAY } from "@config";
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

  // Clear error on input change or clear
  useEffect(() => {
    if (error) setError("");
    // Hide error if response is present
    // (response panel will show instead)
  }, [error, query, response]);

  // Debounce logic in onChange
  const debounceRef = useRef();
  const cancelRef = useRef(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setError("");
    setResponse("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    cancelRef.current = true; // cancel any in-flight
    cancelRef.current = false;
    if (!value) {
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      (async () => {
        try {
          // MOCK: Simulate API delay and response
          await new Promise((res) => setTimeout(res, 1000));
          if (!cancelRef.current) {
            setLoading(false);
            setResponse("This is a sample response from RAG");
          }
          // --- Uncomment below for real API ---
          // const res = await fetch(API_ENDPOINTS.QUERY, {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({ query: value }),
          // });
          // if (!res.ok) throw new Error("API error");
          // const data = await res.json();
          // if (!cancelRef.current) setResponse(data.response || JSON.stringify(data));
        } catch (err) {
          if (!cancelRef.current) {
            console.log("Error fetching response:", err);
            setError("Failed to fetch response.");
          }
        } finally {
          if (!cancelRef.current) setLoading(false);
        }
      })();
    }, DEBOUNCE_MS);
  };
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className={styles["query-gradient-bg"]}>
      <Box className={styles.container}>
        <form
          className={styles.bigSearch}
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            ref={inputRef}
            className={styles.glowInput}
            type="text"
            placeholder="Query from ingested documents"
            value={query}
            onChange={handleInputChange}
            disabled={loading}
          />
        </form>

        {query &&
          !error &&
          (loading ? (
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
