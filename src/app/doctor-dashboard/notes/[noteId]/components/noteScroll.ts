/** Scrolling for the note review: moves the right box without jolting the page, and respects reduced motion. */

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const behaviour = (): ScrollBehavior =>
  prefersReducedMotion() ? "auto" : "smooth";

/** Scroll an element to the middle of whatever scrolls it, without moving the page around it. */
export function centreIn(element: HTMLElement | null) {
  if (!element) return;
  let box = element.parentElement;
  while (
    box &&
    !(
      /(auto|scroll)/.test(getComputedStyle(box).overflowY) &&
      box.scrollHeight > box.clientHeight
    )
  )
    box = box.parentElement;
  if (!box)
    return element.scrollIntoView({ block: "center", behavior: behaviour() });
  const top =
    element.getBoundingClientRect().top -
    box.getBoundingClientRect().top +
    box.scrollTop -
    box.clientHeight / 2 +
    element.offsetHeight / 2;
  box.scrollTo({ top, behavior: behaviour() });
}

export const centrePage = (id: string) =>
  document
    .getElementById(id)
    ?.scrollIntoView({ block: "center", behavior: behaviour() });
/** Bring an element to the middle of the page and move focus to it (a blocker, the next flag). */
export function jumpTo(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  centrePage(id);
  element.focus({ preventScroll: true });
}
export const nearestInView = (id: string) =>
  document
    .getElementById(id)
    ?.scrollIntoView({ block: "nearest", behavior: behaviour() });
export const scrollPageTop = () =>
  window.scrollTo({ top: 0, behavior: behaviour() });
