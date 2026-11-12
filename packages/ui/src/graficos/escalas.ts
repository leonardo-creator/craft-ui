/**
 * Escalas e marcas de eixo — puro, testado. Base comum dos gráficos
 * (antes cada frente tinha W/H/margens fixos e ticks feitos à mão).
 */

export interface Escala {
  (v: number): number;
  inversa: (px: number) => number;
  dominio: [number, number];
  faixa: [number, number];
}

export function escalaLinear(dominio: [number, number], faixa: [number, number]): Escala {
  const [d0, d1] = dominio;
  const [r0, r1] = faixa;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const f = ((v: number) => r0 + (v - d0) * k) as Escala;
  f.inversa = (px: number) => (k === 0 ? d0 : d0 + (px - r0) / k);
  f.dominio = dominio;
  f.faixa = faixa;
  return f;
}

/** Passo "bonito" (1, 2, 2,5 ou 5 × 10ⁿ) para ~n marcas. */
export function passoBonito(amplitude: number, n = 6): number {
  if (!(amplitude > 0)) return 1;
  const bruto = amplitude / Math.max(n, 1);
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const r = bruto / pot;
  const m = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10;
  return m * pot;
}

/** Marcas do eixo dentro de [min, max]. */
export function marcas(min: number, max: number, n = 6): number[] {
  if (min === max) return [min];
  const p = passoBonito(max - min, n);
  const ini = Math.ceil(min / p - 1e-9) * p;
  const out: number[] = [];
  for (let v = ini; v <= max + p * 1e-9; v += p) out.push(Number(v.toFixed(12)));
  return out;
}

/** Domínio arredondado para fora até marcas bonitas (com folga opcional). */
export function dominioBonito(valores: number[], opcoes: { incluirZero?: boolean; folga?: number; n?: number } = {}): [number, number] {
  const fin = valores.filter(Number.isFinite);
  if (!fin.length) return [0, 1];
  let min = Math.min(...fin);
  let max = Math.max(...fin);
  if (opcoes.incluirZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === max) {
    const d = Math.abs(min) || 1;
    min -= d * 0.5;
    max += d * 0.5;
  }
  const folga = (max - min) * (opcoes.folga ?? 0);
  min -= folga;
  max += folga;
  const p = passoBonito(max - min, opcoes.n ?? 6);
  return [Math.floor(min / p + 1e-9) * p, Math.ceil(max / p - 1e-9) * p];
}

/** Número pt-BR com casas automáticas pelo passo do eixo. */
export function formatarNumero(v: number, passo?: number): string {
  const casas = passo ? Math.max(0, Math.min(6, -Math.floor(Math.log10(passo) + 1e-9))) : Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 1 ? 2 : 3;
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Interpolação linear de y em x numa série ordenada por x. */
export function interpolar(pontos: [number, number][], x: number): number | null {
  if (!pontos.length) return null;
  if (x < pontos[0][0] || x > pontos[pontos.length - 1][0]) return null;
  for (let i = 1; i < pontos.length; i++) {
    const [x0, y0] = pontos[i - 1];
    const [x1, y1] = pontos[i];
    if (x >= x0 && x <= x1) return x1 === x0 ? y1 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return null;
}

/** Interseções entre duas séries (ex.: curva da bomba × curva do sistema). */
export function intersecoes(a: [number, number][], b: [number, number][]): [number, number][] {
  const xs = [...new Set([...a, ...b].map((p) => p[0]))].sort((p, q) => p - q);
  const out: [number, number][] = [];
  let ant: { x: number; d: number } | null = null;
  for (const x of xs) {
    const ya = interpolar(a, x);
    const yb = interpolar(b, x);
    if (ya == null || yb == null) {
      ant = null;
      continue;
    }
    const d = ya - yb;
    if (ant && Math.sign(d) !== Math.sign(ant.d) && ant.d !== 0) {
      const t = ant.d / (ant.d - d);
      const xi = ant.x + t * (x - ant.x);
      out.push([xi, interpolar(a, xi)!]);
    } else if (d === 0) out.push([x, ya]);
    ant = { x, d };
  }
  return out;
}

/* ---------------- tempo (Gantt) ---------------- */

export type NivelTempo = "dia" | "semana" | "mes";

/** Nível da régua de tempo pela largura de 1 dia em pixels. */
export function nivelTempo(pxPorDia: number): NivelTempo {
  return pxPorDia >= 18 ? "dia" : pxPorDia >= 4 ? "semana" : "mes";
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Marcas de tempo entre dois dias (dias a partir de `inicio`, data ISO). */
export function marcasTempo(inicio: string, diaMin: number, diaMax: number, nivel: NivelTempo): { dia: number; rotulo: string; forte: boolean }[] {
  const base = new Date(`${inicio}T00:00:00`);
  const data = (d: number) => new Date(base.getTime() + d * 86400000);
  const out: { dia: number; rotulo: string; forte: boolean }[] = [];
  for (let d = Math.floor(diaMin); d <= Math.ceil(diaMax); d++) {
    const dt = data(d);
    const inicioMes = dt.getDate() === 1;
    if (nivel === "dia") out.push({ dia: d, rotulo: String(dt.getDate()), forte: dt.getDay() === 1 || inicioMes });
    else if (nivel === "semana" && dt.getDay() === 1) out.push({ dia: d, rotulo: `${dt.getDate()}/${MESES[dt.getMonth()]}`, forte: inicioMes || dt.getDate() <= 7 });
    else if (nivel === "mes" && inicioMes) out.push({ dia: d, rotulo: `${MESES[dt.getMonth()]}/${String(dt.getFullYear()).slice(2)}`, forte: dt.getMonth() === 0 });
  }
  return out;
}

export function dataDoDia(inicio: string, d: number): string {
  const dt = new Date(new Date(`${inicio}T00:00:00`).getTime() + d * 86400000);
  return dt.toLocaleDateString("pt-BR");
}
