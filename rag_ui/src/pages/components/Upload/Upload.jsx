import { Box, Heading, Text, Stack, FileUpload } from "@chakra-ui/react";
import styles from "./Upload.module.scss";
import UploadCard from "./UploadCard";
import FileUploadCard from "./FileUploadCard";

const Upload = () => {
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
          <FileUploadCard />
          <UploadCard />
        </Stack>
      </Box>
    </div>
  );
};

export default Upload;
