import { Link } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useLayoutEffect, useState } from "react";
import styles from "./TabHeader.module.scss";

const TabHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isQuery = location.pathname.includes("query");
  const isUpload = location.pathname.includes("upload");
  const MotionLink = motion(Link);

  // Refs for tab elements
  const queryRef = useRef(null);
  const uploadRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const activeRef = isQuery ? queryRef : isUpload ? uploadRef : null;
    if (activeRef && activeRef.current) {
      const { offsetLeft, offsetWidth } = activeRef.current;
      setIndicator({ left: offsetLeft, width: offsetWidth });
    }
  }, [isQuery, isUpload]);

  return (
    <div className={styles.header}>
      <div className={styles.nav}>
        <span className={styles.logo}>RAG Demo</span>
        <div className={styles.tabs} style={{ position: "relative" }}>
          <MotionLink
            as="button"
            ref={queryRef}
            onClick={() => navigate("/query")}
            className={styles.tabLink}
            aria-current={isQuery ? "page" : undefined}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Query
          </MotionLink>
          <MotionLink
            as="button"
            ref={uploadRef}
            onClick={() => navigate("/upload")}
            className={styles.tabLink}
            aria-current={isUpload ? "page" : undefined}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Upload
          </MotionLink>
          <motion.div
            className={styles.tabIndicator}
            layout
            initial={false}
            animate={{ left: indicator.left, width: indicator.width }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        </div>
      </div>
    </div>
  );
};

export default TabHeader;
