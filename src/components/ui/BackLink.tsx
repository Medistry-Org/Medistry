import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import furnitureStyles from "./styles/PageFurniture.module.css";

/** The back control's class, for a back button that is not a link (a step back inside a sheet). */
export const backControlClass = furnitureStyles.back;

/** A back link in the app's one style: the arrow on a tinted 7px plate, a 44px target. */
export default function BackLink({ href, label, className = "" }: { href: string; label: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${furnitureStyles.back} ${className}`}>
      <ArrowLeft size={14} weight="bold" aria-hidden="true" />
      {label}
    </Link>
  );
}
