import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Card from "@/components/ui/Card";
import formStyles from "@/components/ui/styles/FormControls.module.css";
import styles from "./OrderReview.module.css";

/** A checkout that cannot go on (incomplete link, payments not live yet) or has finished: one line and a way back. */
export default function CheckoutMessage({ title, text, returnTo, actionLabel }: { title: string; text: string; returnTo: string; actionLabel: string }) {
  return (
    <Card title={title}>
      <p className={styles.calm}>{text}</p>
      <Link href={returnTo} className={`btn ${formStyles.go}`}>
        <span>{actionLabel}</span>
        <span className="well" aria-hidden="true">
          <ArrowRight size={18} />
        </span>
      </Link>
    </Card>
  );
}
