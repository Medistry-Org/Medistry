/** The three things a doctor writes most, above the reply box: one tap fills the box, always editable. */

import styles from "../MessagesPage.module.css";

const QUICK_REPLIES = [
  {
    label: "Noted for your review",
    text: "Thanks for letting me know. I have noted it in your record, and we will go through it at your review.",
  },
  {
    label: "Book a follow-up",
    text: "Please book a follow-up in the app so we can talk this through properly.",
  },
  {
    label: "If worse, call 112",
    text: "If this gets worse, or you feel unwell, go to the nearest hospital or call 112.",
  },
];

export default function QuickReplies({
  onPick,
}: {
  onPick: (text: string) => void;
}) {
  return (
    <div className={styles.quick} role="group" aria-label="Quick replies">
      {QUICK_REPLIES.map((reply) => (
        <button
          key={reply.label}
          type="button"
          onClick={() => onPick(reply.text)}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}
