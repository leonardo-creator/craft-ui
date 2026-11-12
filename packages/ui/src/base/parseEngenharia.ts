/**
 * @craft/ui — parser PURO (portado da BASE COMUM A, frentes 01/04) de entrada de engenharia.
 *
 * Aceita números pt-BR/en-US, fração simples e unidade opcional. NÃO usa
 * `eval`, não lê estado global e é determinístico: a mesma string devolve
 * sempre o mesmo resultado. A UI (`InputEngenharia`) só valida/commita com
 * este parser; a semântica de cronograma continua no motor Rust.
 */

export interface ResultadoEngenharia {
  ok: boolean;
  valor: number;
  unidade?: string;
  erro?: string;
}

/** Unidades conhecidas — chave normalizada (minúscula, sem espaços). */
const UNIDADES: Record<string, string> = {
  mm: "mm",
  milimetro: "mm",
  milimetros: "mm",
  "milímetros": "mm",
  cm: "cm",
  centimetro: "cm",
  centimetros: "cm",
  "centímetros": "cm",
  m: "m",
  metro: "m",
  metros: "m",
  km: "km",
  quilometro: "km",
  quilometros: "km",
  "quilômetros": "km",
  d: "d",
  dia: "d",
  dias: "d",
  ed: "ed",
  s: "s",
  sem: "s",
  semana: "s",
  semanas: "s",
  h: "h",
  hra: "h",
  horas: "h",
  hora: "h",
  "mês": "mês",
  mes: "mês",
  meses: "mês",
  "m2": "m²",
  "m²": "m²",
  "m3": "m³",
  "m³": "m³",
  "l/s": "L/s",
  "litros/s": "L/s",
  "litro/s": "L/s",
  n: "N",
  kn: "kN",
  kgf: "kgf",
  kg: "kg",
  t: "t",
  ton: "t",
  tonelada: "t",
  toneladas: "t",
  "%": "%",
  un: "un",
  und: "un",
  unidade: "un",
  unidades: "un",
};

function erro(mensagem: string): ResultadoEngenharia {
  return { ok: false, valor: Number.NaN, erro: mensagem };
}

/** "1.234,5" / "2,5" / "1.5" / "-10" → número (sem eval). */
function parseNumeroPtBr(texto: string): number | null {
  let s = texto.trim();
  if (!s) return null;
  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");
  if (temVirgula && temPonto) {
    // Formato pt-BR completo: pontos = milhar, vírgula = decimal.
    if (!/^[+-]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return null;
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    if (!/^[+-]?\d+(,\d+)?$/.test(s)) return null;
    s = s.replace(",", ".");
  } else if (temPonto) {
    const pontos = s.split(".").length - 1;
    if (pontos > 1) {
      // "1.234.567" = milhares; "1.2.3" é inválido.
      if (!/^[+-]?\d{1,3}(\.\d{3})+$/.test(s)) return null;
      s = s.replace(/\./g, "");
    } else if (!/^[+-]?\d+(\.\d+)?$/.test(s)) {
      return null;
    }
  } else if (!/^[+-]?\d+$/.test(s)) {
    return null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizarUnidade(bruta: string): string | null {
  const chave = bruta.trim().toLowerCase().replace(/\s+/g, "");
  if (!chave) return null;
  return UNIDADES[chave] ?? null;
}

/** Formatação canônica pt-BR do valor commitado (vírgula decimal, sem milhar). */
export function formatarEngenharia(n: number): string {
  return String(Number(n.toFixed(6))).replace(".", ",");
}

/**
 * `parseEngenharia("2,5")` → 2.5 · `"1.234,5"` → 1234.5 · `"10/2"` → 5 ·
 * `"15cm"` → 15 cm · `"150 mm"` → 150 mm · `"5d"` → 5 d · `"30 L/s"` → 30 L/s ·
 * `"-10 kN"` → -10 kN. Vazio/letras e unidade desconhecida devolvem erro.
 */
export function parseEngenharia(texto: string): ResultadoEngenharia {
  const entrada = (texto ?? "").trim();
  if (!entrada) {
    return erro("Digite um valor numérico.");
  }

  // Fração simples "10/2" (aceita espaços em volta da barra).
  const fracao = entrada.match(/^([^/\s]+)\s*\/\s*([^/\s]+)$/);
  if (fracao) {
    const numerador = parseNumeroPtBr(fracao[1]);
    const denominador = parseNumeroPtBr(fracao[2]);
    if (numerador == null || denominador == null) {
      return erro(`Fração inválida: ${entrada}`);
    }
    if (denominador === 0) {
      return erro("Divisão por zero na fração.");
    }
    return { ok: true, valor: numerador / denominador };
  }

  // Número seguido de unidade opcional ("15cm", "150 mm", "-10 kN").
  const casado = entrada.match(/^([+-]?[0-9][0-9.,]*)\s*(.*)$/);
  if (!casado) {
    return erro(`Valor inválido: ${entrada} (digite um número, ex.: 2,5 ou 15cm)`);
  }
  const numero = parseNumeroPtBr(casado[1]);
  if (numero == null) {
    return erro(`Valor inválido: ${entrada} (digite um número, ex.: 2,5 ou 15cm)`);
  }
  const resto = casado[2].trim();
  if (!resto) return { ok: true, valor: numero };

  const unidade = normalizarUnidade(resto);
  if (!unidade) {
    return erro(`Unidade desconhecida: ${resto}`);
  }
  return { ok: true, valor: numero, unidade };
}
