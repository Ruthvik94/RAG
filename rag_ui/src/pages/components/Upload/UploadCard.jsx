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
import { SPINNER_THICKNESS } from "@config";

import styles from "./Upload.module.scss";

const UploadCard = () => {
  const [showSpinner, setShowSpinner] = useState(false);

  return (
    <Card.Root
      className={styles["upload-card-box-shadow"]}
      w="70vw"
      borderRadius="lg"
      bg="whiteAlpha.300"
      p="0"
    >
      <Card.Header p="4" borderBottomWidth="1" borderColor="gray.200">
        <Box>
          <Text fontSize="x-large" color="white">
            Load sample SQuaD dataset
          </Text>
        </Box>
      </Card.Header>
      <Card.Footer p="4">
        <Box position="relative" aria-busy="true" userSelect="none" w="100%">
          <Button
            w="100%"
            variant="solid"
            className={styles.ingestBtn}
            textStyle="sm"
            fontWeight="bold"
            onClick={() => setShowSpinner(true)}
          >
            Load Dataset
          </Button>
          {showSpinner && (
            <Box pos="absolute" inset="0" bg="bg/80">
              <Center h="full">
                <Spinner color="red.500" thickness={SPINNER_THICKNESS} />
              </Center>
            </Box>
          )}
        </Box>
      </Card.Footer>
    </Card.Root>
  );
};

export default UploadCard;
