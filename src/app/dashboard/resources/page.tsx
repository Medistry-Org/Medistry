"use client";
import Link from "next/link";
import styles from "../dashboard.module.css";

export default function ResourcesPage() {
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <h1>Health resources</h1>
        <p>Helpful health guides and programme resources will appear here.</p>
        <p>
          <Link href="/dashboard">Return to dashboard</Link>
        </p>
      </section>
    </main>
  );
}
