import { useState, useRef } from "react";
import {
  FileUpload,
  Card,
  Button,
  Text,
  Flex,
  Box,
  Tag,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { HiUpload } from "react-icons/hi";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_COUNT,
  SPINNER_THICKNESS,
} from "@config";

import { API_ENDPOINTS } from "@apiConfig";

import styles from "./Upload.module.scss";

const FileUploadCard = ({ isGlobalLoading, onLoadingChange }) => {
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const fileUploadRef = useRef(null);

  const handleChange = (fileObj) => {
    if (!fileObj || fileObj?.files.length === 0) return;
    const uploadedFile = fileObj?.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile); // Store the File object directly
      setError("");
    }
  };

  const handleReject = (rejectedFileObj) => {
    const rejectedFile = rejectedFileObj?.files?.[0];
    const errors = rejectedFile?.errors;
    if (errors.length) {
      let errorMessage;
      if (errors.includes("FILE_INVALID_TYPE", "FILE_TOO_LARGE")) {
        errorMessage = "File type is invalid and file size exceeds 5 MB";
      } else if (errors.includes("FILE_INVALID_TYPE")) {
        errorMessage =
          "File type is invalid, accepted types are PDF, Txt and Docx";
      } else {
        errorMessage = "File size exceeds 5 MB";
      }

      setError(errorMessage);

      // Show error toast for file validation
      toaster.create({
        title: "File Validation Failed",
        description: errorMessage,
        type: "error",
      });
    }
  };
  const handleFileIngest = async () => {
    setShowSpinner(true);
    onLoadingChange(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(API_ENDPOINTS.INGEST, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(180000), // 3 minutes timeout
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to upload file.";

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
              errorMessage = "Invalid file or missing file data.";
              break;
            case 413:
              errorMessage = "File is too large. Maximum size is 5MB.";
              break;
            case 415:
              errorMessage =
                "Unsupported file type. Only PDF, TXT, and DOCX files are allowed.";
              break;
            case 408:
              errorMessage =
                "Upload timeout. Please try a smaller file or try again later.";
              break;
            case 503:
              errorMessage =
                "Service temporarily unavailable. Please try again later.";
              break;
            case 500:
              errorMessage = "Server error occurred. Please try again later.";
              break;
            default:
              errorMessage = `Upload failed (Error ${response.status}). Please try again.`;
          }
        }

        setError(errorMessage);

        // Show error toast
        toaster.create({
          title: "Upload Failed",
          description: errorMessage,
          type: "error",
        });
      } else {
        // Success - clear file and show success toast
        const fileName = file.name;
        setError(""); // Clear any previous errors

        // Show success toast
        toaster.create({
          title: "File Uploaded Successfully",
          description: `"${fileName}" has been ingested successfully`,
          type: "success",
        });
        setFile(null);
      }
    } catch (err) {
      console.error("Upload error:", err);

      let errorMessage;

      // Handle network errors
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (err.name === "AbortError") {
        errorMessage = "Upload was cancelled or timed out. Please try again.";
      } else {
        errorMessage = "An unexpected error occurred while uploading the file.";
      }

      setError(errorMessage);

      // Show error toast
      toaster.create({
        title: "Upload Error",
        description: errorMessage,
        type: "warning",
      });
    } finally {
      setShowSpinner(false);
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
        <Text fontSize="x-large" color="white">
          Ingest File
        </Text>
        <Flex gap="8px">
          <Tag.Root>
            <Tag.Label>.PDF</Tag.Label>
          </Tag.Root>
          <Tag.Root>
            <Tag.Label>.Txt</Tag.Label>
          </Tag.Root>
          <Tag.Root>
            <Tag.Label>.Docx</Tag.Label>
          </Tag.Root>
          <Tag.Root>
            <Tag.Label>Max 5 MB</Tag.Label>
          </Tag.Root>
        </Flex>
      </Card.Header>
      <Card.Body p="4">
        <Box>
          <FileUpload.Root
            maxFileSize={MAX_FILE_SIZE}
            accept={ACCEPTED_FILE_TYPES.join(", ")}
            maxFiles={MAX_FILE_COUNT}
            w="100%"
            onFileAccept={handleChange}
            onFileReject={handleReject}
          >
            <FileUpload.HiddenInput />
            <FileUpload.Trigger asChild>
              <Button
                disabled={!!file || showSpinner || isGlobalLoading}
                variant="outline"
                size="sm"
                w="100%"
                bg="white"
                _hover={{
                  bg: "gray.100",
                  boxShadow: "0 0 5px 2px rgba(206, 201, 49, 0.6)",
                }}
              >
                <HiUpload /> Upload file
              </Button>
            </FileUpload.Trigger>
            <FileUpload.ItemGroup>
              <FileUpload.Context>
                {({ acceptedFiles }) =>
                  acceptedFiles.map((file) => (
                    <FileUpload.Item key={file.name} file={file}>
                      <FileUpload.ItemName />
                      <FileUpload.ItemDeleteTrigger
                        onClick={() => setFile(null)}
                        ref={fileUploadRef}
                      />
                    </FileUpload.Item>
                  ))
                }
              </FileUpload.Context>
            </FileUpload.ItemGroup>
          </FileUpload.Root>
        </Box>
        {error && (
          <Text
            mt="4"
            color="red.500"
            fontWeight="bold"
            fontSize="large"
            textAlign="center"
          >
            {error}
          </Text>
        )}
      </Card.Body>
      {!error && file && (
        <Card.Footer p="4">
          <Flex justify="flex-end" w="100%">
            <Button
              disabled={showSpinner || isGlobalLoading}
              variant="solid"
              className={styles.uploadBtn}
              textStyle="sm"
              fontWeight="bold"
              onClick={handleFileIngest}
            >
              Upload
            </Button>
          </Flex>
        </Card.Footer>
      )}

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
            <Spinner color="teal.500" thickness={SPINNER_THICKNESS} />
          </Center>
        </Box>
      )}
    </Card.Root>
  );
};

export default FileUploadCard;
