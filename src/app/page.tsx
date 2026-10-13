import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Mango challenge</h1>
      <Link className={styles.link} href="/exercise1">
        Exercise 1 — Range
      </Link>
    </main>
  );
}
