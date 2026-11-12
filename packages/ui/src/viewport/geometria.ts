/**
 * Geometria pura do desenho (sem React, sem three) — testada em vitest.
 * Usada pela Prancheta2D e pelo Viewport3D, então 2D e 3D grudam igual.
 */

export type Vec3 = [number, number, number];
export type Eixo = 0 | 1 | 2;
export const NOMES_EIXO = ["x", "y", "z"] as const;

/** Passo da grade para a distância de câmera/zoom: 10^n (… 0,1 · 1 · 10 …). */
export function passoAdaptativo(escalaVisivel: number, divisoesAlvo = 4): number {
  if (!(escalaVisivel > 0)) return 1;
  return Math.pow(10, Math.floor(Math.log10(escalaVisivel / divisoesAlvo)));
}

export function formatarPasso(p: number): string {
  if (p >= 1000) return `${p / 1000} km`;
  if (p >= 1) return `${p} m`;
  if (p >= 0.01) return `${Math.round(p * 100)} cm`;
  return `${Math.round(p * 1000)} mm`;
}

export type TipoEncaixe = "no" | "cruzamento" | "guia" | "grade" | "livre";

export interface Encaixe {
  ponto: Vec3;
  tipo: TipoEncaixe;
  /** Para cada eixo, o nó cuja guia o ponto segue (índice em `nos`) ou -1. */
  alinhadoCom: [number, number, number];
}

/**
 * Encaixa um ponto:
 *  1. nó existente dentro da tolerância;
 *  2. guias: cada coordenada gruda na coordenada do nó mais próximo
 *     (= o ponto cai na guia tracejada X/Y/Z daquele nó; duas coordenadas
 *     grudadas em nós diferentes = cruzamento de guias);
 *  3. grade nas coordenadas que sobraram;
 *  4. trava de eixo: só a coordenada travada varia a partir de `origem`.
 * `plano` = eixos livres (ex.: XY → [0,1]); a coordenada fora do plano fica a da origem.
 */
export function encaixar(
  p: Vec3,
  opcoes: {
    nos: Vec3[];
    passo: number;
    tolerancia: number;
    origem?: Vec3 | null;
    trava?: Eixo | null;
    plano?: Eixo[];
    guias?: boolean;
    grade?: boolean;
  },
): Encaixe {
  const { nos, passo, tolerancia, origem, trava, plano = [0, 1, 2], guias = true, grade = true } = opcoes;
  const q: Vec3 = [...p];
  if (trava != null && origem) {
    for (const e of [0, 1, 2] as Eixo[]) if (e !== trava) q[e] = origem[e];
  }
  // 1. nó
  let melhor = -1;
  let dMelhor = tolerancia;
  nos.forEach((n, i) => {
    const d = Math.hypot(n[0] - q[0], n[1] - q[1], n[2] - q[2]);
    if (d < dMelhor) {
      dMelhor = d;
      melhor = i;
    }
  });
  if (melhor >= 0 && trava == null) {
    return { ponto: [...nos[melhor]] as Vec3, tipo: "no", alinhadoCom: [melhor, melhor, melhor] };
  }
  const alinhado: [number, number, number] = [-1, -1, -1];
  const livres = trava != null ? [trava] : plano;
  // 2. guias
  if (guias) {
    for (const e of livres) {
      let idx = -1;
      let dm = tolerancia * 0.6;
      nos.forEach((n, i) => {
        const d = Math.abs(n[e] - q[e]);
        if (d < dm) {
          dm = d;
          idx = i;
        }
      });
      if (idx >= 0) {
        q[e] = nos[idx][e];
        alinhado[e] = idx;
      }
    }
  }
  // 3. grade
  if (grade && passo > 0) {
    for (const e of livres) if (alinhado[e] < 0) q[e] = Math.round(q[e] / passo) * passo;
  }
  const nAlinh = livres.filter((e) => alinhado[e] >= 0).length;
  const tipo: TipoEncaixe = nAlinh >= 2 ? "cruzamento" : nAlinh === 1 ? "guia" : grade ? "grade" : "livre";
  return { ponto: q.map((v) => Number(v.toFixed(9))) as Vec3, tipo, alinhadoCom: alinhado };
}

/**
 * Entrada de coordenada digitada:
 *  "x,y,z"      absoluto        "@dx,dy,dz"  relativo ao último nó
 *  "@d<ang"     polar no plano (graus a partir do 1º eixo do plano)
 *  "d"          distância na direção atual do cursor (quando `direcao` existe)
 * Aceita vírgula decimal pt-BR quando separado por ";" ou espaço: "@0;0;3,5".
 */
export function lerCoordenada(
  texto: string,
  ultimo: Vec3,
  opcoes: { plano?: Eixo[]; direcao?: Vec3 | null } = {},
): { ok: true; ponto: Vec3 } | { ok: false; erro: string } {
  const t = texto.trim();
  if (!t) return { ok: false, erro: "Digite x,y,z ou @dx,dy,dz" };
  const rel = t.startsWith("@");
  const corpo = rel ? t.slice(1).trim() : t;
  const plano = opcoes.plano ?? [0, 1];
  const num = (s: string) => Number(s.trim().replace(",", "."));

  if (corpo.includes("<")) {
    const [ds, as] = corpo.split("<");
    const d = num(ds);
    const a = (num(as) * Math.PI) / 180;
    if (!isFinite(d) || !isFinite(a)) return { ok: false, erro: "Polar inválido: use @distância<ângulo" };
    const p: Vec3 = [...ultimo];
    p[plano[0]] += d * Math.cos(a);
    p[plano[1]] += d * Math.sin(a);
    return { ok: true, ponto: p.map((v) => Number(v.toFixed(9))) as Vec3 };
  }
  const partes = corpo.includes(";") || /\s/.test(corpo) ? corpo.split(/[;\s]+/) : corpo.split(",");
  const v = partes.map(num);
  if (v.some((x) => !isFinite(x))) return { ok: false, erro: `Número inválido em “${t}”` };
  if (v.length === 1 && opcoes.direcao) {
    const [dx, dy, dz] = opcoes.direcao;
    const L = Math.hypot(dx, dy, dz) || 1;
    return { ok: true, ponto: [ultimo[0] + (dx / L) * v[0], ultimo[1] + (dy / L) * v[0], ultimo[2] + (dz / L) * v[0]] };
  }
  if (v.length === 2) {
    const p: Vec3 = rel ? [...ultimo] : [ultimo[0], ultimo[1], ultimo[2]];
    if (!rel) {
      p[plano[0]] = v[0];
      p[plano[1]] = v[1];
    } else {
      p[plano[0]] += v[0];
      p[plano[1]] += v[1];
    }
    return { ok: true, ponto: p };
  }
  if (v.length !== 3) return { ok: false, erro: "Use 3 valores (x,y,z) ou 2 no plano" };
  const p: Vec3 = rel ? [ultimo[0] + v[0], ultimo[1] + v[1], ultimo[2] + v[2]] : [v[0], v[1], v[2]];
  return { ok: true, ponto: p.map((x) => Number(x.toFixed(9))) as Vec3 };
}

/** Classifica a barra: em pé (pilar), deitada (viga) ou inclinada (diagonal). */
export function orientacao(a: Vec3, b: Vec3, eixoVertical: Eixo = 2): "em-pe" | "deitada" | "inclinada" {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = Math.abs(d[eixoVertical]);
  const h = Math.hypot(...d.filter((_, i) => i !== eixoVertical));
  const ang = (Math.atan2(v, h) * 180) / Math.PI;
  return ang > 89.5 ? "em-pe" : ang < 0.5 ? "deitada" : "inclinada";
}

export const distancia = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
