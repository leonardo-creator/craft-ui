/**
 * Gráfico XY — base de curvas de bomba × sistema (05/07), séries temporais
 * EPS (05), hidrogramas e polutogramas (07), curvas genéricas. Antes: SVG
 * com W=760/H=360 fixos, cores soltas e eixos refeitos em cada arquivo.
 *  - se ajusta ao container (ResizeObserver);
 *  - marcas "bonitas" (1-2-2,5-5) e números pt-BR; unidade no título do eixo;
 *  - mira (crosshair) com valor de TODAS as séries no x do mouse;
 *  - legenda clicável liga/desliga série;
 *  - roda = zoom no eixo X na posição do mouse; arrastar = mover; duplo clique = tudo;
 *  - séries: linha, tracejada, degrau (EPS), área; pontos marcados; linhas de referência;
 *  - `camadaExtra` recebe as escalas para desenhos específicos (PVs do perfil, etc.).
 */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { dominioBonito, escalaLinear, formatarNumero, interpolar, marcas, passoBonito, type Escala } from "./escalas";

export const CORES_SERIE = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#4b5563"];

export interface Serie {
  id: string;
  nome: string;
  pontos: [number, number][];
  cor?: string;
  estilo?: "linha" | "tracejada" | "degrau" | "area";
  /** Mostrar pontos (marcadores) nos vértices. */
  marcadores?: boolean;
  unidade?: string;
  /** Eixo Y: esquerdo (padrão) ou direito (grandeza diferente, ex.: fator de demanda). */
  eixo?: "esq" | "dir";
}

export interface PontoMarcado {
  x: number;
  y: number;
  rotulo?: string;
  cor?: string;
}

export interface LinhaReferencia {
  eixo: "x" | "y";
  valor: number;
  rotulo?: string;
  cor?: string;
}

export interface EscalasGrafico {
  x: Escala;
  y: Escala;
  area: { x: number; y: number; w: number; h: number };
}

export interface GraficoXYProps {
  series: Serie[];
  tituloX?: string;
  tituloY?: string;
  unidadeX?: string;
  unidadeY?: string;
  /** Título/unidade do eixo Y direito (séries com eixo: "dir"). */
  tituloY2?: string;
  unidadeY2?: string;
  pontos?: PontoMarcado[];
  referencias?: LinhaReferencia[];
  altura?: number;
  /** Incluir o zero no eixo Y. */
  yComZero?: boolean;
  /** Inverter o eixo Y (ex.: diagrama de momento com positivo para baixo). */
  yInvertido?: boolean;
  /** Domínio fixo opcional. */
  dominioX?: [number, number];
  dominioY?: [number, number];
  zoom?: boolean;
  legenda?: boolean;
  camadaExtra?: (e: EscalasGrafico) => ReactNode;
  formatarX?: (v: number) => string;
}

export function useTamanho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [tam, setTam] = useState({ w: 600, h: 300 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTam({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setTam({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, tam] as const;
}

const M = { esq: 58, dir: 16, topo: 14, base: 40 };

export function GraficoXY({
  series,
  tituloX,
  tituloY,
  unidadeX,
  unidadeY,
  tituloY2,
  unidadeY2,
  pontos = [],
  referencias = [],
  altura = 320,
  yComZero,
  yInvertido,
  dominioX,
  dominioY,
  zoom = true,
  legenda = true,
  camadaExtra,
  formatarX,
}: GraficoXYProps) {
  const [ref, tam] = useTamanho<HTMLDivElement>();
  const clip = useId().replace(/:/g, "");
  const [ocultas, setOcultas] = useState<Set<string>>(new Set());
  const [mira, setMira] = useState<number | null>(null);
  const visiveis = series.filter((s) => !ocultas.has(s.id));
  const todos = visiveis.flatMap((s) => s.pontos);
  const domXTotal = useMemo<[number, number]>(() => dominioX ?? [Math.min(...todos.map((p) => p[0])), Math.max(...todos.map((p) => p[0]))], [dominioX, todos]);
  const [janela, setJanela] = useState<[number, number] | null>(null);
  const domX = janela ?? (Number.isFinite(domXTotal[0]) ? domXTotal : ([0, 1] as [number, number]));
  const temDir = visiveis.some((s) => s.eixo === "dir");
  const naJanela = (ss: Serie[]) => ss.flatMap((s) => s.pontos).filter((p) => p[0] >= domX[0] && p[0] <= domX[1]).map((p) => p[1]);
  const noJanela = naJanela(visiveis.filter((s) => s.eixo !== "dir"));
  const domY2 = dominioBonito(naJanela(visiveis.filter((s) => s.eixo === "dir")), { incluirZero: true, folga: 0.04 });
  const domY = dominioY ?? dominioBonito([...noJanela, ...pontos.map((p) => p.y), ...referencias.filter((r) => r.eixo === "y").map((r) => r.valor)], { incluirZero: yComZero, folga: 0.04 });

  const mDir = temDir ? 58 : M.dir;
  const area = { x: M.esq, y: M.topo, w: Math.max(tam.w - M.esq - mDir, 10), h: Math.max(altura - M.topo - M.base, 10) };
  const ex = escalaLinear(domX, [area.x, area.x + area.w]);
  const ey = escalaLinear(domY, yInvertido ? [area.y, area.y + area.h] : [area.y + area.h, area.y]);
  const ey2 = escalaLinear(domY2, [area.y + area.h, area.y]);
  const my2 = marcas(domY2[0], domY2[1], Math.max(2, Math.floor(area.h / 45)));
  const py2 = passoBonito(domY2[1] - domY2[0], Math.max(2, Math.floor(area.h / 45)));
  const eyDe = (s: Serie) => (s.eixo === "dir" ? ey2 : ey);
  const mx = marcas(domX[0], domX[1], Math.max(2, Math.floor(area.w / 90)));
  const my = marcas(domY[0], domY[1], Math.max(2, Math.floor(area.h / 45)));
  const px = passoBonito(domX[1] - domX[0], Math.max(2, Math.floor(area.w / 90)));
  const py = passoBonito(domY[1] - domY[0], Math.max(2, Math.floor(area.h / 45)));
  const fx = formatarX ?? ((v: number) => formatarNumero(v, px));
  const arrasto = useRef<{ x: number; dom: [number, number] } | null>(null);

  function caminho(s: Serie) {
    const pts = s.pontos;
    const ey = eyDe(s);
    if (!pts.length) return "";
    if (s.estilo === "degrau") {
      let d = `M${ex(pts[0][0])} ${ey(pts[0][1])}`;
      for (let i = 1; i < pts.length; i++) d += `H${ex(pts[i][0])}V${ey(pts[i][1])}`;
      return d;
    }
    return pts.map((p, i) => `${i ? "L" : "M"}${ex(p[0]).toFixed(1)} ${ey(p[1]).toFixed(1)}`).join("");
  }

  const xMira = mira != null ? ex.inversa(mira) : null;

  return (
    <div className="w-full select-none">
      <div ref={ref} className="relative w-full" style={{ height: altura }}>
        <svg
          width={tam.w}
          height={altura}
          className="block"
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const x = e.clientX - r.left;
            if (arrasto.current) {
              const dx = ex.inversa(arrasto.current.x) - ex.inversa(x);
              setJanela([arrasto.current.dom[0] + dx, arrasto.current.dom[1] + dx]);
              arrasto.current.x = x;
              arrasto.current.dom = [arrasto.current.dom[0] + dx, arrasto.current.dom[1] + dx];
              return;
            }
            setMira(x >= area.x && x <= area.x + area.w ? x : null);
          }}
          onPointerLeave={() => setMira(null)}
          onPointerDown={(e) => {
            if (!zoom) return;
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            arrasto.current = { x: e.clientX - r.left, dom: domX };
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
          }}
          onPointerUp={() => (arrasto.current = null)}
          onDoubleClick={() => setJanela(null)}
          onWheel={(e) => {
            if (!zoom) return;
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const c = ex.inversa(e.clientX - r.left);
            const f = e.deltaY < 0 ? 0.8 : 1.25;
            const n: [number, number] = [c - (c - domX[0]) * f, c + (domX[1] - c) * f];
            const total = domXTotal[1] - domXTotal[0];
            if (n[1] - n[0] >= total) setJanela(null);
            else setJanela(n);
          }}
        >
          <defs>
            <clipPath id={clip}>
              <rect x={area.x} y={area.y} width={area.w} height={area.h} />
            </clipPath>
          </defs>
          {/* grade */}
          {my.map((v) => (
            <g key={`y${v}`}>
              <line x1={area.x} x2={area.x + area.w} y1={ey(v)} y2={ey(v)} stroke={v === 0 ? "var(--cr-linha-forte)" : "var(--cr-linha)"} />
              <text x={area.x - 6} y={ey(v) + 3.5} textAnchor="end" className="fill-texto-2 font-mono text-[10.5px]">
                {formatarNumero(v, py)}
              </text>
            </g>
          ))}
          {mx.map((v) => (
            <g key={`x${v}`}>
              <line y1={area.y} y2={area.y + area.h} x1={ex(v)} x2={ex(v)} stroke="var(--cr-linha)" />
              <text x={ex(v)} y={area.y + area.h + 14} textAnchor="middle" className="fill-texto-2 font-mono text-[10.5px]">
                {fx(v)}
              </text>
            </g>
          ))}
          <rect x={area.x} y={area.y} width={area.w} height={area.h} fill="none" stroke="var(--cr-linha-forte)" />
          {tituloX && (
            <text x={area.x + area.w / 2} y={altura - 6} textAnchor="middle" className="fill-texto-2 text-[11px]">
              {tituloX}
              {unidadeX && <tspan className="font-mono text-texto-3"> [{unidadeX}]</tspan>}
            </text>
          )}
          {temDir &&
            my2.map((v) => (
              <text key={`y2${v}`} x={area.x + area.w + 6} y={ey2(v) + 3.5} className="fill-texto-2 font-mono text-[10.5px]">
                {formatarNumero(v, py2)}
              </text>
            ))}
          {temDir && tituloY2 && (
            <text transform={`translate(${tam.w - 8} ${area.y + area.h / 2}) rotate(90)`} textAnchor="middle" className="fill-texto-2 text-[11px]">
              {tituloY2}
              {unidadeY2 && <tspan className="font-mono text-texto-3"> [{unidadeY2}]</tspan>}
            </text>
          )}
          {tituloY && (
            <text transform={`translate(13 ${area.y + area.h / 2}) rotate(-90)`} textAnchor="middle" className="fill-texto-2 text-[11px]">
              {tituloY}
              {unidadeY && <tspan className="font-mono text-texto-3"> [{unidadeY}]</tspan>}
            </text>
          )}

          <g clipPath={`url(#${clip})`}>
            {referencias.map((r, i) =>
              r.eixo === "x" ? (
                <g key={i}>
                  <line x1={ex(r.valor)} x2={ex(r.valor)} y1={area.y} y2={area.y + area.h} stroke={r.cor ?? "var(--cr-alerta)"} strokeDasharray="4 3" />
                  {r.rotulo && (
                    <text x={ex(r.valor) + 4} y={area.y + 11} className="text-[10px]" fill={r.cor ?? "var(--cr-alerta)"}>
                      {r.rotulo}
                    </text>
                  )}
                </g>
              ) : (
                <g key={i}>
                  <line y1={ey(r.valor)} y2={ey(r.valor)} x1={area.x} x2={area.x + area.w} stroke={r.cor ?? "var(--cr-alerta)"} strokeDasharray="4 3" />
                  {r.rotulo && (
                    <text x={area.x + area.w - 4} y={ey(r.valor) - 4} textAnchor="end" className="text-[10px]" fill={r.cor ?? "var(--cr-alerta)"}>
                      {r.rotulo}
                    </text>
                  )}
                </g>
              ),
            )}
            {visiveis.map((s, i) => {
              const cor = s.cor ?? CORES_SERIE[series.indexOf(s) % CORES_SERIE.length];
              const d = caminho(s);
              return (
                <g key={s.id}>
                  {s.estilo === "area" && s.pontos.length > 1 && (
                    <path d={`${d}L${ex(s.pontos[s.pontos.length - 1][0])} ${eyDe(s)(Math.max((s.eixo === "dir" ? domY2 : domY)[0], Math.min(0, (s.eixo === "dir" ? domY2 : domY)[1])))}L${ex(s.pontos[0][0])} ${eyDe(s)(Math.max((s.eixo === "dir" ? domY2 : domY)[0], Math.min(0, (s.eixo === "dir" ? domY2 : domY)[1])))}Z`} fill={cor} opacity={0.14} />
                  )}
                  <path d={d} fill="none" stroke={cor} strokeWidth={2} strokeDasharray={s.estilo === "tracejada" ? "6 4" : undefined} strokeLinejoin="round" data-serie={i} />
                  {s.marcadores && s.pontos.map((p, k) => <circle key={k} cx={ex(p[0])} cy={eyDe(s)(p[1])} r={2.6} fill="var(--cr-painel)" stroke={cor} strokeWidth={1.5} />)}
                </g>
              );
            })}
            {camadaExtra?.({ x: ex, y: ey, area })}
            {pontos.map((p, i) => (
              <g key={i}>
                <circle cx={ex(p.x)} cy={ey(p.y)} r={5} fill={p.cor ?? "var(--cr-texto)"} stroke="var(--cr-painel)" strokeWidth={2} />
                {p.rotulo && (
                  <text x={ex(p.x) + 8} y={ey(p.y) - 8} className="fill-texto font-mono text-[11px] font-semibold">
                    {p.rotulo}
                  </text>
                )}
              </g>
            ))}
            {mira != null && <line x1={mira} x2={mira} y1={area.y} y2={area.y + area.h} stroke="var(--cr-texto-3)" strokeDasharray="2 3" />}
          </g>
        </svg>
        {mira != null && xMira != null && (
          <div
            className="pointer-events-none absolute z-10 border border-linha bg-painel px-2 py-1 font-mono text-[11px] shadow-flutuante"
            style={{ left: Math.min(mira + 12, tam.w - 170), top: M.topo + 4 }}
          >
            <div className="text-texto-2">
              {tituloX ?? "x"} {fx(xMira)} {unidadeX ?? ""}
            </div>
            {visiveis.map((s) => {
              const v = s.estilo === "degrau" ? [...s.pontos].reverse().find((p) => p[0] <= xMira)?.[1] ?? null : interpolar(s.pontos, xMira);
              const cor = s.cor ?? CORES_SERIE[series.indexOf(s) % CORES_SERIE.length];
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-3" style={{ background: cor }} />
                  <span className="text-texto-2">{s.nome}</span>
                  <span className="ml-auto pl-3 text-texto">{v == null ? "—" : `${formatarNumero(v, (s.eixo === "dir" ? py2 : py) / 10)} ${s.unidade ?? (s.eixo === "dir" ? unidadeY2 : unidadeY) ?? ""}`}</span>
                </div>
              );
            })}
          </div>
        )}
        {janela && (
          <button type="button" onClick={() => setJanela(null)} className="absolute right-4 top-3 border border-linha bg-painel px-1.5 text-[10px] text-texto-2 hover:text-acento">
            ver tudo
          </button>
        )}
      </div>
      {legenda && series.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 pl-14 text-[11px]">
          {series.map((s, i) => {
            const cor = s.cor ?? CORES_SERIE[i % CORES_SERIE.length];
            const off = ocultas.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={!off}
                title={off ? "Mostrar série" : "Ocultar série"}
                onClick={() =>
                  setOcultas((o) => {
                    const n = new Set(o);
                    if (n.has(s.id)) n.delete(s.id);
                    else n.add(s.id);
                    return n;
                  })
                }
                className={`flex items-center gap-1.5 ${off ? "text-texto-3 line-through" : "text-texto-2 hover:text-texto"}`}
              >
                <svg width="16" height="8">
                  <line x1="0" y1="4" x2="16" y2="4" stroke={cor} strokeWidth="2" strokeDasharray={s.estilo === "tracejada" ? "4 3" : undefined} />
                </svg>
                {s.nome}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
