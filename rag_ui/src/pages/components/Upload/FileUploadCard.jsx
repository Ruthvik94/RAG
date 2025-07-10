import { useState } from "react";
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
import { HiUpload } from "react-icons/hi";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_COUNT,
  SPINNER_THICKNESS,
} from "@config";

import { API_ENDPOINTS } from "@apiConfig";

import styles from "./Upload.module.scss";

const FileUploadCard = () => {
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [showSpinner, setShowSpinner] = useState(false);

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
      if (errors.includes("FILE_INVALID_TYPE", "FILE_TOO_LARGE")) {
        setError("File type is invalid and file size exceeds 5 MB");
      } else if (errors.includes("FILE_INVALID_TYPE")) {
        setError("File type is invalid, accepted types are PDP, Txt and Docx");
      } else {
        setError("File size exceeds 5 MB");
      }
    }
  };

  const handleFileIngest = async () => {
    setShowSpinner(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(API_ENDPOINTS.INGEST, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorMsg = await response.json();
        setError(errorMsg || "Failed to upload file.");
      } else {
        setFile(null);
      }
    } catch (err) {
      setError("An error occurred while uploading the file.", err);
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
                disabled={!!file}
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
          <Box position="relative" aria-busy="true" userSelect="none">
            <Flex justify="flex-end" w="100%">
              <Button
                variant="solid"
                className={styles.uploadBtn}
                textStyle="sm"
                fontWeight="bold"
                onClick={handleFileIngest}
              >
                Upload
              </Button>
              {showSpinner && (
                <Box pos="absolute" inset="0" bg="bg/80">
                  <Center h="full">
                    <Spinner color="teal.500" thickness={SPINNER_THICKNESS} />
                  </Center>
                </Box>
              )}
            </Flex>
          </Box>
        </Card.Footer>
      )}
    </Card.Root>
  );
};

export default FileUploadCard;
