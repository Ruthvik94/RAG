import React, { useEffect, useState } from "react";
import styles from "./Query.module.scss";

function AnimatedResponseText({ text, delay }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const words = text.split(/(\s+)/);
  // Faster animation: 60ms per word (default if not provided)
  const fastDelay = delay ? Math.max(30, Math.floor(delay / 2)) : 60;
  useEffect(() => {
    if (!text) return;
    setVisibleCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= words.length) clearInterval(interval);
    }, fastDelay);
    return () => clearInterval(interval);
  }, [text, fastDelay, words.length]);
  return <p className={styles.responseText}>{words.slice(0, visibleCount).join("")}</p>;
}

export default AnimatedResponseText;
