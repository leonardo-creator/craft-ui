import { useEffect, useRef, type RefObject } from "react";

/**
 * Roda do mouse com listener NÃO passivo. O `onWheel` do React é passivo:
 * `preventDefault()` ali é ignorado e a página rola junto com o zoom do
 * gráfico (e Ctrl+roda dá zoom no navegador inteiro). Use este hook em todo
 * componente que dá zoom pela roda.
 */
export function useRoda<T extends Element>(ref: RefObject<T | null>, aoRodar: (e: WheelEvent, el: T) => void) {
  const fn = useRef(aoRodar);
  fn.current = aoRodar;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = (e: Event) => fn.current(e as WheelEvent, el);
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [ref]);
}
