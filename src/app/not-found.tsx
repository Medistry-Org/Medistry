import Link from "next/link";
import ContourField from "@/components/ContourField";
import { Wordmark } from "@/components/ui";
import s from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={s.page}>
      <ContourField className={s.field} density={10} lineAlpha={0.12} signalAlpha={0.5} />
      <Link href="/" className={s.brand} aria-label="Medistry home">
        <Wordmark />
      </Link>
      <div className={s.copy}>
        <h1 className="display">This page is still being prepared.</h1>
        <p>
          It will be ready soon. In the meantime you can check where you stand, or write to{" "}
          <a href="mailto:care@medistry.in">care@medistry.in</a>.
        </p>
        <Link href="/#check" className="btn btn--mint">
          <span>See where you stand</span>
          <span className="well" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32Z" /></svg>
          </span>
        </Link>
      </div>
    </main>
  );
}
