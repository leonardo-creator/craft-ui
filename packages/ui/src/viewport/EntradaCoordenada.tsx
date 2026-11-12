/**
 * Caixa de coordenada que aparece AO DIGITAR durante o desenho (não precisa
 * clicar num campo): digite "3" e Enter = 3 m na direção do cursor;
 * "@0,0,3" relativo; "4,0,3" absoluto; "@2<45" polar. Mostra o erro na hora.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function EntradaCoordenada({
  aberta,
  textoInicial,
  onAplicar,
  onFechar,
  dica = "3 · @0,0,3 · 4,0,3 · @2<45",
  erro,
}: {
  aberta: boolean;
  textoInicial: string;
  onAplicar: (t: string) => void;
  onFechar: () => void;
  dica?: string;
  erro?: string | null;
}) {
  const [t, setT] = useState(textoInicial);
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (aberta) {
      setT(textoInicial);
      ref.current?.focus();
    }
  }, [aberta, textoInicial]);
  if (!aberta) return null;
  return (
    <div className="pointer-events-auto absolute bottom-10 left-1/2 z-30 -translate-x-1/2 border border-acento bg-painel shadow-flutuante">
      <div className="flex items-center gap-2 px-2 py-1">
        <span className="text-[11px] text-texto-2">Próximo ponto</span>
        <input
          ref={ref}
          autoFocus
          value={t}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") onAplicar(t);
            if (e.key === "Escape") onFechar();
          }}
          className="h-7 w-48 border border-linha-forte bg-painel px-2 font-mono text-[13px] outline-none focus:border-acento"
        />
      </div>
      <div className={`border-t border-linha px-2 py-0.5 font-mono text-[10px] ${erro ? "text-erro" : "text-texto-3"}`}>{erro ?? dica}</div>
    </div>
  );
}

/**
 * "A vista é o último lugar clicado" — como num app desktop. Teclas de
 * desenho (X/Y/Z, Esc, digitar coordenada) só valem para a vista ativa,
 * sem depender do mouse estar parado em cima dela.
 */
export function useVistaAtiva(ref: React.RefObject<HTMLElement | null>) {
  const ativa = useRef(false);
  useEffect(() => {
    const f = (e: PointerEvent) => {
      ativa.current = !!ref.current?.contains(e.target as Node);
    };
    window.addEventListener("pointerdown", f, true);
    return () => window.removeEventListener("pointerdown", f, true);
  }, [ref]);
  return ativa;
}

/** Começa a digitar coordenada com dígito, "@", "-" ou "." */
export function teclaIniciaCoordenada(e: KeyboardEvent | React.KeyboardEvent) {
  return !e.ctrlKey && !e.metaKey && !e.altKey && /^[0-9@.\-]$/.test(e.key);
}
