/**
 * Input de engenharia — portado da BASE COMUM A (frentes 01/04/05) e
 * melhorado. Comportamento preservado (era o que funcionava):
 *  - enquanto digita, o texto é preservado (nada de coerção/zero);
 *  - commit só em Enter, Tab ou blur; Esc restaura o original;
 *  - inválido no commit → borda vermelha + mensagem, texto fica para corrigir.
 * Melhorias:
 *  - sufixo de unidade visível dentro do campo ("m", "kN", "L/s");
 *  - erro em linha (não flutua por cima do vizinho);
 *  - conversão de qualquer comprimento (mm/cm/m/km) para a unidade do campo;
 *  - limites min/max com mensagem clara;
 *  - setas ↑/↓ incrementam pelo `passo` (Shift = ×10).
 */
import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";
import { formatarEngenharia, parseEngenharia, type ResultadoEngenharia } from "./parseEngenharia";

const FATOR_PARA_M: Record<string, number> = { mm: 0.001, cm: 0.01, m: 1, km: 1000 };

export type UnidadeComprimento = "mm" | "cm" | "m" | "km";

export interface InputEngenhariaProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "value" | "onChange" | "onBlur" | "min" | "max"> {
  valor: string | number;
  /** Chamado SÓ no commit válido (Enter/Tab/blur). `resultado.valor` já está na unidade do campo. */
  onChange: (texto: string, resultado: ResultadoEngenharia) => void;
  onCancelar?: () => void;
  /** Enter desce / Tab anda — quem está em volta (tabela, formulário) decide. */
  onNavegar?: (direcao: "baixo" | "direita" | "esquerda") => void;
  /** Unidade de comprimento do CAMPO: "25cm" num campo em m commita 0,25. */
  unidadeCampo?: UnidadeComprimento;
  /** Sufixo exibido dentro do campo (ex.: "m", "kN", "L/s"). Padrão = unidadeCampo. */
  sufixo?: string;
  min?: number;
  max?: number;
  /** Incremento das setas ↑/↓. */
  passo?: number;
  /** Layout compacto para células de tabela. */
  compacto?: boolean;
  "data-testid"?: string;
}

function converterParaCampo(r: ResultadoEngenharia, campo?: UnidadeComprimento): number {
  if (!campo) return r.valor;
  const fator = FATOR_PARA_M[r.unidade ?? ""];
  if (fator === undefined) return r.valor;
  return (r.valor * fator) / FATOR_PARA_M[campo];
}

export function InputEngenharia({
  valor,
  onChange,
  onCancelar,
  onNavegar,
  unidadeCampo,
  sufixo,
  min,
  max,
  passo,
  compacto,
  className = "",
  "data-testid": dataTestId,
  ...resto
}: InputEngenhariaProps) {
  const valorOriginal = typeof valor === "number" ? formatarEngenharia(valor) : String(valor ?? "");
  const [texto, setTexto] = useState(valorOriginal);
  const [erro, setErro] = useState<string | null>(null);
  const focado = useRef(false);
  const commitado = useRef(false);
  const idErro = useId();
  const rotuloSufixo = sufixo ?? unidadeCampo;

  useEffect(() => {
    if (!focado.current) {
      setTexto(valorOriginal);
      setErro(null);
    }
  }, [valorOriginal]);

  function commitar(textoAtual = texto): boolean {
    if (commitado.current) return true;
    const r = parseEngenharia(textoAtual);
    if (!r.ok) {
      setErro(r.erro ?? "Valor inválido.");
      return false;
    }
    const v = converterParaCampo(r, unidadeCampo);
    if (min !== undefined && v < min) {
      setErro(`Mínimo ${formatarEngenharia(min)}${rotuloSufixo ? " " + rotuloSufixo : ""}`);
      return false;
    }
    if (max !== undefined && v > max) {
      setErro(`Máximo ${formatarEngenharia(max)}${rotuloSufixo ? " " + rotuloSufixo : ""}`);
      return false;
    }
    setErro(null);
    commitado.current = true;
    onChange(textoAtual, { ...r, valor: v, unidade: unidadeCampo ?? r.unidade });
    setTexto(formatarEngenharia(v));
    return true;
  }

  function incrementar(sinal: 1 | -1, multiplicador: number) {
    if (!passo) return;
    const r = parseEngenharia(texto);
    const base = r.ok ? converterParaCampo(r, unidadeCampo) : 0;
    let novo = Number((base + sinal * passo * multiplicador).toFixed(6));
    if (min !== undefined) novo = Math.max(min, novo);
    if (max !== undefined) novo = Math.min(max, novo);
    const t = formatarEngenharia(novo);
    setTexto(t);
    setErro(null);
    commitado.current = false;
  }

  const borda = erro
    ? "border-erro bg-erro-suave"
    : "border-linha-forte bg-painel hover:border-texto-3 focus-within:border-acento";

  return (
    <span className={`block ${className}`}>
      <span className={`flex items-stretch border ${borda} ${compacto ? "h-6" : "h-7"}`}>
        <input
          {...resto}
          type="text"
          inputMode="decimal"
          spellCheck={false}
          autoComplete="off"
          data-testid={dataTestId}
          value={texto}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? idErro : undefined}
          className="min-w-0 flex-1 bg-transparent px-1.5 text-right font-mono text-[12px] text-texto outline-none"
          onFocus={(e) => {
            focado.current = true;
            commitado.current = false;
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setTexto(e.target.value);
            setErro(null);
            commitado.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Dentro de um <form> (Dialogo), Enter válido deixa o submit seguir:
              // commita aqui e o diálogo confirma. Só segura o Enter se o valor
              // for inválido ou se quem está em volta navega (tabela).
              const ok = commitar((e.target as HTMLInputElement).value);
              if (!ok || onNavegar) e.preventDefault();
              if (ok) onNavegar?.("baixo");
            } else if (e.key === "Tab" && onNavegar) {
              e.preventDefault();
              if (commitar()) onNavegar(e.shiftKey ? "esquerda" : "direita");
            } else if (e.key === "Escape") {
              // 1º Esc desfaz a edição do campo; se não havia edição, o Esc
              // sobe (o diálogo fecha). Assim Esc nunca "morre" no campo.
              const editado = texto !== valorOriginal || erro != null;
              if (editado || onCancelar) {
                e.preventDefault();
                e.stopPropagation();
              }
              setTexto(valorOriginal);
              setErro(null);
              commitado.current = true;
              onCancelar?.();
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              if (passo) {
                e.preventDefault();
                incrementar(e.key === "ArrowUp" ? 1 : -1, e.shiftKey ? 10 : 1);
              }
            }
            resto.onKeyDown?.(e);
          }}
          onBlur={() => {
            focado.current = false;
            commitar();
          }}
        />
        {rotuloSufixo && (
          <span className="flex select-none items-center border-l border-linha bg-painel-2 px-1.5 font-mono text-[11px] text-texto-2">
            {rotuloSufixo}
          </span>
        )}
      </span>
      {erro && (
        <span id={idErro} role="alert" className="mt-0.5 block text-[11px] leading-tight text-erro">
          {erro}
        </span>
      )}
    </span>
  );
}
