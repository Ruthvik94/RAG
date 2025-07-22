import { useState } from "react";
import {
  Box,
  Card,
  Button,
  Text,
  Flex,
  Spinner,
  Center,
  Link,
} from "@chakra-ui/react";
import { LuExternalLink } from "react-icons/lu";
import { toaster } from "@/components/ui/toaster";
import { SPINNER_THICKNESS } from "@config";
import { API_ENDPOINTS } from "@apiConfig";

import styles from "./Upload.module.scss";

const UploadCard = ({ isGlobalLoading, onLoadingChange }) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState("");

  const handleSquadDatasetIngest = async () => {
    setShowSpinner(true);
    onLoadingChange(true);
    setError("");

    try {
      // Make a simple POST request to load sample dataset endpoint
      const response = await fetch(API_ENDPOINTS.LOAD_SAMPLE_DATASET, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(180000), // 3 minutes timeout
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to load SQuAD dataset.";

        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            errorMessage = await response.text();
          }
        } catch {
          // If parsing fails, use status-based error messages
          switch (response.status) {
            case 400:
              errorMessage = "Invalid request or missing data.";
              break;
            case 404:
              errorMessage = "SQuAD dataset file not found on server.";
              break;
            case 413:
              errorMessage = "Dataset file is too large.";
              break;
            case 408:
              errorMessage = "Request timeout. Please try again later.";
              break;
            case 503:
              errorMessage =
                "Service temporarily unavailable. Please try again later.";
              break;
            case 500:
              errorMessage = "Server error occurred. Please try again later.";
              break;
            default:
              errorMessage = `Loading failed (Error ${response.status}). Please try again.`;
          }
        }

        setError(errorMessage);

        // Show error toast
        toaster.create({
          title: "Dataset Loading Failed",
          description: errorMessage,
          type: "error",
        });
      } else {
        // Success - clear error and show success toast
        setError("");

        // Show success toast
        toaster.create({
          title: "Dataset Loaded Successfully",
          description:
            "SQuAD dataset has been loaded and ingested successfully",
          type: "success",
        });
      }
    } catch (err) {
      console.error("Dataset loading error:", err);

      let errorMessage;

      // Handle network errors
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.name === "AbortError") {
        errorMessage = "Request was cancelled or timed out. Please try again.";
      } else {
        errorMessage =
          "An unexpected error occurred while loading the dataset.";
      }

      setError(errorMessage);

      // Show error toast
      toaster.create({
        title: "Loading Error",
        description: errorMessage,
        type: "warning",
      });
    } finally {
      setShowSpinner(false);
      onLoadingChange(false);
    }
  };

  return (
    <Card.Root
      className={styles["upload-card-box-shadow"]}
      w="70vw"
      borderRadius="lg"
      bg="whiteAlpha.300"
      p="0"
      position="relative"
    >
      <Card.Header p="4" borderBottomWidth="1" borderColor="gray.200">
        <Box>
          <Text fontSize="x-large" color="white">
            Load SQuAD 2.0 Project Report
          </Text>
          <Text fontSize="small">
            <Link
              target="_blank"
              color="whiteAlpha.700"
              variant="underline"
              href="https://web.stanford.edu/class/archive/cs/cs224n/cs224n.1194/reports/default/15785042.pdf"
            >
              Document can be found here <LuExternalLink />
            </Link>
          </Text>
        </Box>
      </Card.Header>
      <Card.Body p="4">
        {error && (
          <Text
            color="red.500"
            fontWeight="bold"
            fontSize="large"
            textAlign="center"
          >
            {error}
          </Text>
        )}
      </Card.Body>
      <Card.Footer p="4">
        <Button
          disabled={showSpinner || isGlobalLoading}
          w="100%"
          variant="solid"
          className={styles.ingestBtn}
          textStyle="sm"
          fontWeight="bold"
          onClick={handleSquadDatasetIngest}
        >
          Load Dataset
        </Button>
      </Card.Footer>

      {/* Full page overlay spinner */}
      {showSpinner && (
        <Box
          pos="absolute"
          inset="0"
          bg="bg/80"
          borderRadius="lg"
          userSelect="none"
          aria-busy="true"
        >
          <Center h="full">
            <Spinner color="red.500" thickness={SPINNER_THICKNESS} />
          </Center>
        </Box>
      )}
    </Card.Root>
  );
};

export default UploadCard;
