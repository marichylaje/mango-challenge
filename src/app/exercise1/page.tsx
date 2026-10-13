import type { Metadata } from "next";
import { Suspense } from "react";
import { RangeContainer } from "@/features/range/components/RangeContainer/RangeContainer";
import { RangeSkeleton } from "@/features/range/components/RangeSkeleton/RangeSkeleton";
import styles from "./exercise1.module.css";

export const metadata: Metadata = { title: "Exercise 1 — Range" };

export default function Exercise1Page() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Exercise 1 — Range</h1>
      <Suspense fallback={<RangeSkeleton />}>
        <RangeContainer />
      </Suspense>
    </main>
  );
}
