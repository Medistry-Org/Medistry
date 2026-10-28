/* The full-width submit at the foot of a profile sheet: its label, or "Saving" with a spinner. */

import { ArrowRight } from "@phosphor-icons/react";
import formStyles from "@/components/ui/styles/FormControls.module.css";

export default function SaveButton({
  busy,
  label = "Save",
  busyLabel = "Saving",
}: {
  busy: boolean;
  label?: string;
  busyLabel?: string;
}) {
  return (
    <button
      type="submit"
      className={`btn ${formStyles.go}`}
      data-busy={busy}
      disabled={busy}
    >
      <span>{busy ? busyLabel : label}</span>
      <span className="well" aria-hidden="true">
        {busy ? <span className={formStyles.spin} /> : <ArrowRight size={18} />}
      </span>
    </button>
  );
}
