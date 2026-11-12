/**
 * Diagrama de nós e ligações — base de PERT e Diagrama de Rede (04),
 * Unifilar (03) e esquemas de rede (07). Pan/zoom, seleção, arestas
 * ortogonais com seta, nós com título + linhas de detalhe, destaque crítico,
 * layout automático em CAMADAS (precedência) ou posições livres.
 */
import { useMemo, useRef, useState } from "react";
import { useTamanho } from "./GraficoXY";

export interface NoDiagrama {
  id: string;
  titulo: string;
  /** Linhas de detalhe (ex.: "ES 0 · EF 5", "5 d"). */
  linhas?: string[];
  /** Posição livre (unidades do diagrama). Se faltar, usa o layout em camadas. */
  x?: number;
  y?: number;
  destaque?: "critico" | "alerta" | null;
}

/** Camada = maior distância desde uma raiz (longest path). Ciclos são ignorados. */
export function camadasPert(ids: string[], arestas: [string, string][]): Record<string, number> {
  const pred = new Map<string, string[]>();
  ids.forEach((i) => pred.set(i, []));
  arestas.forEach(([a, b]) => pred.get(b)?.push(a));
  const memo: Record<string, number> = {};
  const visitando = new Set<string>();
  const camada = (id: string): number => {
    if (id in memo) return memo[id];
    if (visitando.has(id)) return 0;
    visitando.add(id);
    const ps = pred.get(id) ?? [];
    const v = ps.length ? Math.max(...ps.map(camada)) + 1 : 0;
    visitando.delete(id);
    memo[id] = v;
    return v;
  };
  ids.forEach(camada);
  return memo;
}

const LW = 150;
const LH = 58;
const GX = 70;
const GY = 26;

export function DiagramaNos({
  nos,
  arestas,
  selecionado,
  onSelecionar,
  altura = 380,
}: {
  nos: NoDiagrama[];
  arestas: [string, string][];
  selecionado?: string | null;
  onSelecionar?: (id: string | null) => void;
  altura?: number;
}) {
  const [ref, tam] = useTamanho<HTMLDivElement>();
  const pos = useMemo(() => {
    const c = camadasPert(
      nos.map((n) => n.id),
      arestas,
    );
    const porCamada = new Map<number, string[]>();
    nos.forEach((n) => porCamada.set(c[n.id], [...(porCamada.get(c[n.id]) ?? []), n.id]));
    const p = new Map<string, { x: number; y: number }>();
    nos.forEach((n) => {
      if (n.x != null && n.y != null) p.set(n.id, { x: n.x, y: n.y });
      else {
        const col = porCamada.get(c[n.id])!;
        p.set(n.id, { x: c[n.id] * (LW + GX), y: col.indexOf(n.id) * (LH + GY) });
      }
    });
    return p;
  }, [nos, arestas]);
  const xs = [...pos.values()];
  const larg = Math.max(...xs.map((p) => p.x)) + LW;
  const alt = Math.max(...xs.map((p) => p.y)) + LH;
  // enquadra, mas nunca abaixo de 70%: texto ilegível é pior que precisar arrastar
  const ajuste = Math.max(0.7, Math.min(1, (tam.w - 40) / Math.max(larg, 1), (altura - 40) / Math.max(alt, 1)));
  const [vista, setVista] = useState<{ x: number; y: number; k: number } | null>(null);
  const v = vista ?? { x: 20, y: 20, k: ajuste };
  const arr = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const porId = new Map(nos.map((n) => [n.id, n]));

  return (
    <div ref={ref} className="relative w-full select-none overflow-hidden border border-linha bg-area" style={{ height: altura }}>
      <svg
        width={tam.w}
        height={altura}
        className="block cursor-grab active:cursor-grabbing"
        onWheel={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const mx = e.clientX - r.left;
          const my = e.clientY - r.top;
          const k = Math.max(0.2, Math.min(3, v.k * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
          setVista({ k, x: mx - ((mx - v.x) * k) / v.k, y: my - ((my - v.y) * k) / v.k });
        }}
        onPointerDown={(e) => {
          if ((e.target as Element).closest("[data-no]")) return;
          arr.current = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y };
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!arr.current) return;
          setVista({ ...v, x: arr.current.vx + e.clientX - arr.current.x, y: arr.current.vy + e.clientY - arr.current.y });
        }}
        onPointerUp={(e) => {
          if (arr.current && Math.hypot(e.clientX - arr.current.x, e.clientY - arr.current.y) < 3) onSelecionar?.(null);
          arr.current = null;
        }}
        onDoubleClick={() => setVista(null)}
      >
        <g transform={`translate(${v.x} ${v.y}) scale(${v.k})`}>
          {arestas.map(([a, b]) => {
            const pa = pos.get(a);
            const pb = pos.get(b);
            if (!pa || !pb) return null;
            const crit = porId.get(a)?.destaque === "critico" && porId.get(b)?.destaque === "critico";
            const x1 = pa.x + LW;
            const y1 = pa.y + LH / 2;
            const x2 = pb.x;
            const y2 = pb.y + LH / 2;
            const xm = x1 + (x2 - x1) / 2;
            const cor = crit ? "var(--cr-erro)" : "var(--cr-texto-3)";
            return (
              <g key={`${a}>${b}`}>
                <path d={`M${x1} ${y1}H${xm}V${y2}H${x2 - 2}`} fill="none" stroke={cor} strokeWidth={crit ? 1.8 : 1.2} />
                <path d={`M${x2 - 7} ${y2 - 4}L${x2} ${y2}L${x2 - 7} ${y2 + 4}Z`} fill={cor} />
              </g>
            );
          })}
          {nos.map((n) => {
            const p = pos.get(n.id)!;
            const sel = selecionado === n.id;
            const borda = n.destaque === "critico" ? "var(--cr-erro)" : n.destaque === "alerta" ? "var(--cr-alerta)" : "var(--cr-linha-forte)";
            return (
              <g key={n.id} data-no={n.id} transform={`translate(${p.x} ${p.y})`} className="cursor-pointer" onClick={() => onSelecionar?.(n.id)}>
                <rect width={LW} height={LH} fill="var(--cr-painel)" stroke={sel ? "var(--cr-acento)" : borda} strokeWidth={sel ? 2.5 : n.destaque ? 1.8 : 1} />
                <rect width={LW} height={18} fill={n.destaque === "critico" ? "var(--cr-erro-suave)" : "var(--cr-painel-2)"} />
                <text x={6} y={13} className="fill-texto text-[11px] font-semibold">
                  {n.titulo.length > 22 ? n.titulo.slice(0, 21) + "…" : n.titulo}
                </text>
                {(n.linhas ?? []).slice(0, 2).map((l, i) => (
                  <text key={i} x={6} y={33 + i * 14} className="fill-texto-2 font-mono text-[10px]">
                    {l}
                  </text>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-1 left-2 text-[10px] text-texto-3">Roda = zoom · arrastar = mover · duplo clique = enquadrar</div>
    </div>
  );
}
