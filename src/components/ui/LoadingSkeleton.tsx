import layoutStyles from "./styles/AppLayout.module.css";

/** The waiting state for a whole page: the title and two surfaces as soft placeholders. */
export default function LoadingSkeleton() {
  return (
    <div className={layoutStyles.skeleton} aria-busy="true" aria-label="Loading">
      <span className={layoutStyles.ghost} style={{ width: "48%", height: 44 }} />
      <span className={layoutStyles.ghost} style={{ height: 120 }} />
      <span className={layoutStyles.ghost} style={{ height: 180 }} />
    </div>
  );
}
