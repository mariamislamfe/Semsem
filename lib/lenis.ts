import type Lenis from "lenis";

/** Shared handle so sheets/dialogs can freeze page scrolling while open. */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export function scrollToEl(el: HTMLElement, offset = -90) {
  if (instance) instance.scrollTo(el, { offset, duration: 1.1 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function lockScroll() {
  instance?.stop();
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll() {
  document.documentElement.style.overflow = "";
  instance?.start();
}
