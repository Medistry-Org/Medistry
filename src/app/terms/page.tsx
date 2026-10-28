import Link from "next/link";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "70vh",
        maxWidth: 760,
        margin: "0 auto",
        padding: "4rem 1.5rem",
      }}
    >
      <h1>Terms of service</h1>
      <p>
        This page content has not been supplied in the project. Please contact
        care@medistry.in for further information.
      </p>
      <Link href="/">Back to home</Link>
    </main>
  );
}
