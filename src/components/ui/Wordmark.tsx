/** The Medistry wordmark, outlined from the supplied artwork (wordmarkPaths). Black or white only (brand kit). */

import { LOGO_BODY_PATH, LOGO_DOT_PATH, LOGO_VIEWBOX } from "./wordmarkPaths";

export default function Wordmark({
  className,
  height = 30,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <svg
      className={className}
      height={height}
      width={(height * 3633) / 1384}
      viewBox={LOGO_VIEWBOX}
      role="img"
      aria-label="Medistry"
      style={{ display: "block", overflow: "visible" }}
    >
      <path d={LOGO_BODY_PATH} fill="currentColor" fillRule="evenodd" />
      <path d={LOGO_DOT_PATH} fill="currentColor" />
    </svg>
  );
}
