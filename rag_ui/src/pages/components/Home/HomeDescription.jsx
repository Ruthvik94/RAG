import styles from "./Home.module.scss";
import { Text, Box } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useLayoutEffect } from "react";

const descriptionGroups = [
  "Retrieval-Augmented Generation (RAG) is an advanced AI technique that combines the power of large language models (LLMs) with external knowledge sources.",
  "Instead of relying solely on pre-trained data, RAG retrieves relevant information from external documents or databases in real time, then uses that information to generate more accurate, up-to-date, and context-aware responses.",
  "This approach is widely used in modern chatbots, search engines, and enterprise AI solutions to provide reliable and explainable answers.",
];

const HomeDescription = ({ onDone, start }) => {
  const [shown, setShown] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const groupRefs = useRef([]);

  useLayoutEffect(() => {
    // Calculate the max height of all description groups
    let total = 0;
    groupRefs.current.forEach((el) => {
      if (el) total += el.offsetHeight;
    });
    setMaxHeight(total);
  }, []);


  useEffect(() => {
    if (!start) return;
    if (shown < descriptionGroups.length) {
      const timeout = setTimeout(() => setShown(shown + 1), 800);
      return () => clearTimeout(timeout);
    } else if (onDone) {
      // Wait for the last animation to finish before calling onDone
      const doneTimeout = setTimeout(() => onDone(), 350);
      return () => clearTimeout(doneTimeout);
    }
  }, [shown, onDone, start]);

  return (
    <Box className={styles.descriptionBox} style={{ marginBottom: 32, minHeight: maxHeight ? `${maxHeight}px` : "120px" }}>
      <Text as="div" className={styles.descriptionText}>
        {descriptionGroups.map((group, i) => (
          <AnimatePresence key={i}>
            {i < shown && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={styles.descGroup}
                ref={(el) => (groupRefs.current[i] = el)}
              >
                {group}
              </motion.span>
            )}
            {/* Always render a hidden span for measurement */}
            <span
              ref={(el) => (groupRefs.current[i] = el)}
              className={styles.descGroupHidden}
            >
              {group}
            </span>
          </AnimatePresence>
        ))}
      </Text>
    </Box>
  );
};

export default HomeDescription;
// This file has been moved to components/HomeDescription.jsx and can be deleted.
