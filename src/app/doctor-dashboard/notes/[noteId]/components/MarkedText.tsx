/** Text with the cited words marked and the words the transcriber was unsure of underlined. */

import { Fragment } from "react";
import styles from "./NoteSections.module.css";

export default function MarkedText({
  text,
  quotes = [],
  unsure,
}: {
  text: string;
  quotes?: string[];
  unsure?: string | null;
}) {
  const bits = new Array<number>(text.length).fill(0);
  const paint = (words: string, bit: number) => {
    const i = text.indexOf(words);
    if (i >= 0) for (let j = i; j < i + words.length; j++) bits[j] |= bit;
  };
  quotes.forEach((quote) => paint(quote, 1));
  if (unsure) paint(unsure, 2);
  const runs: { bit: number; text: string }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = runs.at(-1);
    if (last && last.bit === bits[i]) last.text += text[i];
    else runs.push({ bit: bits[i], text: text[i] });
  }
  return (
    <>
      {runs.map((run, i) => {
        const inner =
          run.bit & 2 ? (
            <span className={styles.unsure}>
              {run.text}
              <span className="sr-only"> (unclear)</span>
            </span>
          ) : (
            run.text
          );
        return run.bit & 1 ? (
          <mark key={i}>{inner}</mark>
        ) : (
          <Fragment key={i}>{inner}</Fragment>
        );
      })}
    </>
  );
}
