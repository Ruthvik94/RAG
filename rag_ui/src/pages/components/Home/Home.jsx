import styles from "./Home.module.scss";
import { Box, Button, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { motion } from "framer-motion";
import HomeTitle from "./HomeTitle";
import HomeDescription from "./HomeDescription";
import { Link } from "react-router-dom";

const MotionButton = motion(Button);

const Home = () => {
  const [showDesc, setShowDesc] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const [ctaShadow, setCtaShadow] = useState();
  const handleCtaMove = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;
    // Focus blue shadow at pointer, subtle gray all around
    setCtaShadow(
      `0 2px 8px 0 rgba(180,190,210,0.18), ` +
        `0 ${Math.round((py - 0.5) * 16)}px ${
          32 + Math.round(32 * Math.abs(py - 0.5))
        }px ${Math.round((px - 0.5) * 16)}px rgba(49,130,206,0.38)`
    );
  };
  const handleCtaLeave = () => setCtaShadow();

  return (
    <Box className={styles.home}>
      <VStack spacing={8} w="100%">
        <HomeTitle onDone={() => setShowDesc(true)} />
        <HomeDescription start={showDesc} onDone={() => setShowButton(true)} />
        <Box className={styles.centeredRow}>
          {showButton && (
            <MotionButton
              as={Link}
              to="/query"
              colorScheme="blue"
              size="lg"
              className={styles.ctaButton}
              style={ctaShadow ? { boxShadow: ctaShadow } : undefined}
              onMouseMove={handleCtaMove}
              onMouseLeave={handleCtaLeave}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              type="primary"
            >
              Try a Query
            </MotionButton>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default Home;
