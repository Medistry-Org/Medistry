import Link from "next/link";

export default function AssessmentPage() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <section style={{ maxWidth: 620, textAlign: "center" }}>
        <p>MEDISTRY · FREE ELIGIBILITY CHECK</p>
        <h1>Start your health assessment</h1>
        <p>
          The assessment service is not configured in this project yet. Please
          contact care@medistry.in for help getting started.
        </p>
        <Link href="/">Back to home</Link>
      </section>
    </main>
  );
}
