/** Scrolling for the note review: moves the right box without jolting the page, and respects reduced motion. */

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const behaviour = (): ScrollBehavior => (prefersReducedMotion() ? "auto" : "smooth");

/** Scroll an element to the middle of whatever scrolls it, without moving the page around it. */
export function centreIn(el: HTMLElement | null) {
  if (!el) return;
  let box = el.parentElement;
  while (box && !(/(auto|scroll)/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight)) box = box.parentElement;
  if (!box) return el.scrollIntoView({ block: "center", behavior: behaviour() });
  const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - box.clientHeight / 2 + el.offsetHeight / 2;
  box.scrollTo({ top, behavior: behaviour() });
}

export const centrePage = (id: string) => document.getElementById(id)?.scrollIntoView({ block: "center", behavior: behaviour() });
export const nearestInView = (id: string) => document.getElementById(id)?.scrollIntoView({ block: "nearest", behavior: behaviour() });
export const scrollPageTop = () => window.scrollTo({ top: 0, behavior: behaviour() });
