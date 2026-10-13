"use client";

import styles from "./RangeError.module.css";

interface RangeErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function RangeError({ message, onRetry }: RangeErrorProps) {
  return (
    <div role="alert" className={styles.root}>
      <p className={styles.message}>{message}</p>
      <button type="button" className={styles.button} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
