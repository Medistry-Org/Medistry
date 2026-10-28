/** A back link in the app's one style: the arrow on a tinted 7px plate, a 44px target. */

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import styles from "./BackLink.module.css";

/** The back control's class, for a back button that is not a link (a step back inside a flow). */
export const backControlClass = styles.back;

export default function BackLink({
  href,
  label,
}: {
  href: string;
  label: ReactNode;
}) {
  return (
    <Link href={href} className={styles.back}>
      <ArrowLeft size={14} weight="bold" aria-hidden="true" />
      {label}
    </Link>
  );
}
