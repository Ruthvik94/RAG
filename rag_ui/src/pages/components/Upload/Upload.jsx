import { useState } from "react";
import { Box, Stack } from "@chakra-ui/react";
import styles from "./Upload.module.scss";
import UploadCard from "./UploadCard";
import FileUploadCard from "./FileUploadCard";
import ClearDocumentsCard from "./ClearDocumentsCard";

const Upload = () => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const handleLoadingChange = (loading) => {
    setIsGlobalLoading(loading);
  };
  ``;
  return (
    <div className={styles["upload-gradient-bg"]}>
      <Box className={styles.container}>
        <Stack
          align="center"
          mt="16"
          gap="8"
          maxHeight="80vh"
          overflowY="auto"
          scrollbarWidth="thin"
          scrollBehavior="smooth"
        >
          <FileUploadCard
            isGlobalLoading={isGlobalLoading}
            onLoadingChange={handleLoadingChange}
          />
          <UploadCard
            isGlobalLoading={isGlobalLoading}
            onLoadingChange={handleLoadingChange}
          />
          <ClearDocumentsCard
            isGlobalLoading={isGlobalLoading}
            onLoadingChange={handleLoadingChange}
          />
        </Stack>
      </Box>
    </div>
  );
};

export default Upload;
