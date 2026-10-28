import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import formStyles from "./styles/FormControls.module.css";

/** A failed load or save, in words, with an optional retry. */
export default function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <p className={formStyles.err} role="alert">
      <WarningCircle size={16} weight="bold" aria-hidden="true" />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className={formStyles.link} onClick={onRetry}>
          Try again
        </button>
      )}
    </p>
  );
}
