import { useState } from "react";
import {
  Box,
  Card,
  Button,
  Text,
  Flex,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { SPINNER_THICKNESS } from "@config";
import { API_ENDPOINTS } from "@apiConfig";

import styles from "./Upload.module.scss";

const ClearDocumentsCard = ({ isGlobalLoading, onLoadingChange }) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState("");

  const handleClearDocuments = async () => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL ingested documents from the database.\n\nThis action cannot be undone. Are you sure you want to continue?"
    );

    if (!isConfirmed) {
      return;
    }

    setShowSpinner(true);
    onLoadingChange(true);
    setError("");

    try {
      const response = await fetch(API_ENDPOINTS.CLEAR_DOCUMENTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(90000), // 90 seconds timeout
      });

      if (!response.ok) {
        let errorMessage = "Failed to clear documents.";

        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            errorMessage = await response.text();
          }
        } catch {
          switch (response.status) {
            case 400:
              errorMessage = "Bad request. Please try again.";
              break;
            case 500:
              errorMessage = "Server error. Please try again later.";
              break;
            case 404:
              errorMessage =
                "Clear endpoint not found. Please check server configuration.";
              break;
            default:
              errorMessage = `HTTP ${response.status}: Failed to clear documents.`;
          }
        }

        setError(errorMessage);
        toaster.create({
          title: "Clear Failed",
          description: errorMessage,
          type: "error",
        });
        return;
      }

      const result = await response.json();
      const deletedCount = result.deletedCount || result.deleted_count || 0;

      const successMessage =
        deletedCount > 0
          ? `Successfully cleared ${deletedCount} documents from the database.`
          : "Database was already empty - no documents to clear.";

      // Show success toast
      toaster.create({
        title: "Documents Cleared",
        description: successMessage,
        type: "success",
      });
    } catch (err) {
      console.error("Clear documents error:", err);

      let errorMessage =
        "An unexpected error occurred while clearing documents.";

      if (err.name === "TypeError" && err.message.includes("fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.name === "AbortError") {
        errorMessage = "Request was cancelled or timed out. Please try again.";
      }

      setError(errorMessage);

      toaster.create({
        title: "Clear Error",
        description: errorMessage,
        type: "error",
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
            Clear All Documents
          </Text>
        </Box>
      </Card.Header>
      <Card.Body p="4">
        <Text color="white" mb="2">
          Remove all ingested documents from the database. This action cannot be
          undone.
        </Text>
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
          colorScheme="red"
          textStyle="sm"
          fontWeight="bold"
          onClick={handleClearDocuments}
        >
          Clear All Documents
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

export default ClearDocumentsCard;
