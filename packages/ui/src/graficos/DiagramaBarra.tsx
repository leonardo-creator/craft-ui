/**
 * Diagrama de esforços ao longo da barra (N, V, M) — base do DiagramasNVM
 * da 01 e dos diagramas da 06/08. Convenções de engenharia:
 *  - momento positivo desenhado do lado TRACIONADO (para baixo) — opcional;
 *  - positivo e negativo com cores diferentes e hachura vertical clássica;
 *  - máximos/mínimos rotulados automaticamente;
 *  - mira mostra x e o valor interpolado.
 */
import { useState } from "react";
import { dominioBonito, escalaLinear, formatarNumero, interpolar } from "./escalas";
import { useTamanho } from "./GraficoXY";

export function DiagramaBarra({
  comprimento,
  valores,
  esforco,
  unidade,
  altura = 180,
  momentoParaBaixo = true,
  rotuloBarra,
}: {
  comprimento: number;
  /** [x (m), valor] ordenado por x. */
  valores: [number, number][];
  esforco: "N" | "V" | "M";
  unidade: string;
  altura?: number;
  /** Desenha M positivo para baixo (lado tracionado). */
  momentoParaBaixo?: boolean;
  rotuloBarra?: string;
}) {
  const [ref, tam] = useTamanho<HTMLDivElement>();
  const [mira, setMira] = useState<number | null>(null);
  const m = { esq: 40, dir: 40, topo: 34, base: 22 };
  const w = Math.max(tam.w - m.esq - m.dir, 20);
  const h = altura - m.topo - m.base;
  const ys = valores.map((v) => v[1]);
  const [y0, y1] = dominioBonito(ys, { incluirZero: true });
  const lim = Math.max(Math.abs(y0), Math.abs(y1)) || 1;
  const inverter = esforco === "M" && momentoParaBaixo;
  const ex = escalaLinear([0, comprimento], [m.esq, m.esq + w]);
  const ey = escalaLinear([-lim, lim], inverter ? [m.topo, m.topo + h] : [m.topo + h, m.topo]);
  const base = ey(0);

  // separa trechos positivos/negativos (corta no zero)
  const trechos: { sinal: 1 | -1; pts: [number, number][] }[] = [];
  for (let i = 0; i < valores.length; i++) {
    const [x, v] = valores[i];
    const s: 1 | -1 = v >= 0 ? 1 : -1;
    const atual = trechos[trechos.length - 1];
    if (!atual || atual.sinal !== s) {
      if (atual && i > 0) {
        const [xa, va] = valores[i - 1];
        const xz = xa + (va / (va - v)) * (x - xa);
        atual.pts.push([xz, 0]);
        trechos.push({ sinal: s, pts: [[xz, 0], [x, v]] });
      } else trechos.push({ sinal: s, pts: [[x, v]] });
    } else atual.pts.push([x, v]);
  }
  const iMax = ys.indexOf(Math.max(...ys));
  const iMin = ys.indexOf(Math.min(...ys));
  const extremos = [...new Set([iMax, iMin])].filter((i) => Math.abs(ys[i]) > 1e-9);
  const cor = (s: 1 | -1) => (s > 0 ? "var(--cr-acento)" : "var(--cr-erro)");
  const xm = mira != null ? ex.inversa(mira) : null;
  const vm = xm != null ? interpolar(valores, xm) : null;

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: altura }}>
      <svg
        width={tam.w}
        height={altura}
        onPointerMove={(e) => {
          const x = e.clientX - (e.currentTarget as SVGSVGElement).getBoundingClientRect().left;
          setMira(x >= m.esq && x <= m.esq + w ? x : null);
        }}
        onPointerLeave={() => setMira(null)}
      >
        <text x={6} y={14} className="fill-texto text-[12px] font-semibold">
          {esforco}
          <tspan className="font-mono text-[10px] font-normal text-texto-3"> [{unidade}]</tspan>
        </text>
        {trechos.map((t, i) => {
          const d = `M${ex(t.pts[0][0])} ${base}` + t.pts.map((p) => `L${ex(p[0])} ${ey(p[1])}`).join("") + `L${ex(t.pts[t.pts.length - 1][0])} ${base}Z`;
          const hach = [];
          const passo = Math.max(comprimento / 40, 1e-6);
          for (let x = t.pts[0][0]; x <= t.pts[t.pts.length - 1][0]; x += passo) {
            const v = interpolar(t.pts, x);
            if (v != null) hach.push(<line key={x} x1={ex(x)} x2={ex(x)} y1={base} y2={ey(v)} stroke={cor(t.sinal)} strokeWidth={0.8} opacity={0.5} />);
          }
          return (
            <g key={i}>
              <path d={d} fill={cor(t.sinal)} opacity={0.12} />
              {hach}
              <path d={t.pts.map((p, k) => `${k ? "L" : "M"}${ex(p[0])} ${ey(p[1])}`).join("")} fill="none" stroke={cor(t.sinal)} strokeWidth={1.8} />
            </g>
          );
        })}
        {/* barra */}
        <line x1={ex(0)} x2={ex(comprimento)} y1={base} y2={base} stroke="var(--cr-texto)" strokeWidth={3} />
        <circle cx={ex(0)} cy={base} r={3.5} fill="var(--cr-texto)" />
        <circle cx={ex(comprimento)} cy={base} r={3.5} fill="var(--cr-texto)" />
        {rotuloBarra && (
          <text x={ex(comprimento) + 8} y={base + 4} className="fill-texto-2 text-[11px]">
            {rotuloBarra}
          </text>
        )}
        {extremos.map((i) => {
          const [x, v] = valores[i];
          const acima = ey(v) < base;
          return (
            <text key={i} x={ex(x)} y={ey(v) + (acima ? -6 : 14)} textAnchor="middle" className="font-mono text-[11px] font-semibold" fill={cor(v >= 0 ? 1 : -1)}>
              {formatarNumero(v, Math.abs(v) >= 100 ? 1 : 0.01)}
            </text>
          );
        })}
        <text x={ex(0)} y={altura - 4} textAnchor="middle" className="fill-texto-3 font-mono text-[10px]">
          0
        </text>
        <text x={ex(comprimento)} y={altura - 4} textAnchor="middle" className="fill-texto-3 font-mono text-[10px]">
          {formatarNumero(comprimento, 0.01)} m
        </text>
        {mira != null && vm != null && (
          <g pointerEvents="none">
            <line x1={mira} x2={mira} y1={m.topo} y2={m.topo + h} stroke="var(--cr-texto-3)" strokeDasharray="2 3" />
            <circle cx={mira} cy={ey(vm)} r={3.5} fill="var(--cr-painel)" stroke={cor(vm >= 0 ? 1 : -1)} strokeWidth={2} />
            <text x={mira + 6} y={m.topo + 10} className="fill-texto font-mono text-[10.5px]">
              x {formatarNumero(xm!, 0.01)} m · {formatarNumero(vm, 0.01)} {unidade}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
