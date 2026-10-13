import styles from "./RangeSkeleton.module.css";

export function RangeSkeleton() {
  return (
    <>
      <div className={styles.root} aria-hidden="true">
        <div className={`${styles.block} ${styles.input}`} />
        <div className={styles.track}>
          <div className={`${styles.block} ${styles.rail}`} />
          <div className={`${styles.block} ${styles.handle} ${styles.handleStart}`} />
          <div className={`${styles.block} ${styles.handle} ${styles.handleEnd}`} />
        </div>
        <div className={`${styles.block} ${styles.input}`} />
      </div>
      <span role="status" className="srOnly">
        Loading range…
      </span>
    </>
  );
}
