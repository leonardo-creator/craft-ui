/**
 * Minigráfico para células de tabela e painéis (Sparkline da 05: 389 linhas).
 * Mostra tendência, último valor e faixa (mín/máx) — sem eixos.
 */
import { escalaLinear, formatarNumero } from "./escalas";

export function Sparkline({
  valores,
  largura = 90,
  altura = 22,
  cor = "var(--cr-acento)",
  limite,
  mostrarUltimo = true,
}: {
  valores: number[];
  largura?: number;
  altura?: number;
  cor?: string;
  /** Linha de limite (ex.: pressão mínima). Valores além ficam em vermelho. */
  limite?: { valor: number; tipo: "min" | "max" };
  mostrarUltimo?: boolean;
}) {
  if (!valores.length) return <span className="text-texto-3">—</span>;
  const min = Math.min(...valores, limite?.valor ?? Infinity);
  const max = Math.max(...valores, limite?.valor ?? -Infinity);
  const ex = escalaLinear([0, Math.max(valores.length - 1, 1)], [1, largura - 1]);
  const ey = escalaLinear([min, max === min ? min + 1 : max], [altura - 2, 2]);
  const d = valores.map((v, i) => `${i ? "L" : "M"}${ex(i).toFixed(1)} ${ey(v).toFixed(1)}`).join("");
  const ultimo = valores[valores.length - 1];
  const fora = (v: number) => limite && (limite.tipo === "min" ? v < limite.valor : v > limite.valor);
  return (
    <span className="inline-flex items-center gap-1.5 align-middle" title={`mín ${formatarNumero(Math.min(...valores))} · máx ${formatarNumero(Math.max(...valores))}`}>
      <svg width={largura} height={altura} className="block">
        {limite && <line x1={0} x2={largura} y1={ey(limite.valor)} y2={ey(limite.valor)} stroke="var(--cr-erro)" strokeDasharray="2 2" strokeWidth={1} />}
        <path d={d} fill="none" stroke={cor} strokeWidth={1.5} strokeLinejoin="round" />
        {valores.map((v, i) => (fora(v) ? <circle key={i} cx={ex(i)} cy={ey(v)} r={1.8} fill="var(--cr-erro)" /> : null))}
        <circle cx={ex(valores.length - 1)} cy={ey(ultimo)} r={2.2} fill={fora(ultimo) ? "var(--cr-erro)" : cor} />
      </svg>
      {mostrarUltimo && <span className={`font-mono text-[11px] ${fora(ultimo) ? "text-erro" : "text-texto"}`}>{formatarNumero(ultimo)}</span>}
    </span>
  );
}
