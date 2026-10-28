import Image from "next/image";
import surfaceStyles from "./styles/Surfaces.module.css";

/** Round portrait, or the person's initials on carbon when there is no photo. */
export default function Avatar({ name, src, size = 56 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .replace(/^Dr\.?\s+/, "")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  return src ? (
    <Image className={surfaceStyles.avatar} src={src} alt="" width={size} height={size} style={{ width: size, height: size }} unoptimized />
  ) : (
    <span className={surfaceStyles.avatarText} style={{ width: size, height: size, fontSize: Math.max(14, size * 0.34) }} aria-hidden="true">
      {initials}
    </span>
  );
}
