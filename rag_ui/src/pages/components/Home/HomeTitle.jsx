import styles from "./Home.module.scss";
import { Heading, Box } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const title = "Retrieval-Augmented Generation (RAG)";
const acronym = "RAG";

function splitTitle(title, acronym) {
  const idx = title.indexOf(acronym);
  if (idx === -1) return { before: title, acronym: "", after: "" };
  return {
    before: title.slice(0, idx),
    acronym,
    after: title.slice(idx + acronym.length),
  };
}

function Bracket({ type, visible }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      style={{
        minWidth: "1ch",
        display: "inline-block",
        verticalAlign: "baseline",
      }}
    >
      {type === "open" ? "(" : type === "close" ? ")" : ""}
    </motion.span>
  );
}

function Acronym({ text, visible }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      style={{
        minWidth: `${text.length}ch`,
        display: "inline-block",
        color: "#3182ce",
        verticalAlign: "baseline",
      }}
    >
      {text}
    </motion.span>
  );
}

function AnimatedLetters({ letters, direction }) {
  return letters.map((l, i) => (
    <motion.span
      key={direction + i}
      initial={{ x: direction === "left" ? -60 : 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
      style={{ display: "inline-block" }}
    >
      {l}
    </motion.span>
  ));
}

const { before, acronym: rag, after } = splitTitle(title, acronym);
const beforeLetters = before.split("").filter((l) => l !== "(");
const afterLetters = after.split("").filter((l) => l !== ")");

const HomeTitle = ({ onDone }) => {
  const [showAcronym, setShowAcronym] = useState(false);
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    const total = beforeLetters.length;
    const acronymDelay = total * 60 + 400;
    const afterDelay = acronymDelay + 500;
    const acronymTimeout = setTimeout(() => setShowAcronym(true), acronymDelay);
    const afterTimeout = setTimeout(() => {
      setShowAfter(true);
      if (onDone) onDone();
    }, afterDelay + afterLetters.length * 60);
    return () => {
      clearTimeout(acronymTimeout);
      clearTimeout(afterTimeout);
    };
  }, [onDone]);

  return (
    <Box className={styles.homeTitleBox}>
      <Heading as="h1" className={styles.homeHeading}>
        {/* Left to right */}
        <AnimatedLetters letters={beforeLetters} direction="left" />
        {/* Brackets and acronym - animate all three together */}
        <span
          style={{
            display: "inline-block",
            minWidth: "7ch",
            textAlign: "center",
            position: "relative",
            verticalAlign: "baseline",
          }}
        >
          <Bracket type="open" visible={showAcronym} />
          <Acronym text={rag} visible={showAcronym} />
          <Bracket type="close" visible={showAcronym} />
        </span>
        {/* Right to left */}
        {showAfter && (
          <AnimatedLetters letters={afterLetters} direction="right" />
        )}
      </Heading>
    </Box>
  );
};

export default HomeTitle;

// This file has been moved to components/HomeTitle.jsx and can be deleted.
