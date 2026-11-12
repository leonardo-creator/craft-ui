/**
 * Peças de formulário. Regra: rótulo à esquerda em coluna fixa, valor à
 * direita, ajuda/erro abaixo — o mesmo grid em todos os diálogos das 7 frentes,
 * para o olho achar o campo sempre no mesmo lugar.
 */
import { useId, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { Icone, type NomeIcone } from "./icones";

export function Campo({
  rotulo,
  ajuda,
  norma,
  children,
}: {
  rotulo: ReactNode;
  /** Texto curto abaixo do campo. */
  ajuda?: ReactNode;
  /** Referência normativa (ex.: "NBR 6123 §5.2") — aparece em mono, discreta. */
  norma?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-[minmax(120px,40%)_1fr] items-start gap-x-3 gap-y-0.5 py-1">
      <label htmlFor={id} className="pt-1 text-[12px] text-texto-2">
        {rotulo}
        {norma && <span className="ml-1 font-mono text-[10px] text-texto-3">{norma}</span>}
      </label>
      <div id={id}>
        {children}
        {ajuda && <p className="mt-0.5 text-[11px] text-texto-3">{ajuda}</p>}
      </div>
    </div>
  );
}

export function GrupoCampos({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-linha pt-2 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-texto-2">{titulo}</legend>
      {children}
    </fieldset>
  );
}

export function Selecao({
  opcoes,
  className = "",
  ...resto
}: SelectHTMLAttributes<HTMLSelectElement> & { opcoes: { valor: string; rotulo: string }[] }) {
  return (
    <select
      {...resto}
      className={`h-7 w-full border border-linha-forte bg-painel px-1.5 text-[12px] text-texto outline-none hover:border-texto-3 focus:border-acento ${className}`}
    >
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}

export function Alternar({
  marcado,
  onChange,
  rotulo,
}: {
  marcado: boolean;
  onChange: (v: boolean) => void;
  rotulo?: ReactNode;
}) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[12px] text-texto">
      <button
        type="button"
        role="switch"
        aria-checked={marcado}
        onClick={() => onChange(!marcado)}
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${marcado ? "bg-acento" : "bg-linha-forte"}`}
      >
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${marcado ? "left-3.5" : "left-0.5"}`} />
      </button>
      {rotulo}
    </label>
  );
}

export function Segmentado<T extends string>({
  valor,
  opcoes,
  onChange,
}: {
  valor: T;
  opcoes: { valor: T; rotulo: ReactNode; titulo?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" className="inline-flex border border-linha-forte bg-painel">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={o.valor === valor}
          title={o.titulo}
          onClick={() => onChange(o.valor)}
          className={`h-7 border-r border-linha px-2.5 text-[12px] last:border-r-0 ${
            o.valor === valor ? "bg-acento text-white" : "text-texto hover:bg-acento-suave"
          }`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

type VarianteBotao = "primario" | "secundario" | "fantasma" | "perigo";

export function Botao({
  variante = "secundario",
  icone,
  children,
  className = "",
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBotao; icone?: NomeIcone }) {
  const cores: Record<VarianteBotao, string> = {
    primario: "bg-acento text-white border-acento hover:brightness-110",
    secundario: "bg-painel text-texto border-linha-forte hover:bg-acento-suave hover:border-acento-borda",
    fantasma: "bg-transparent text-texto border-transparent hover:bg-acento-suave",
    perigo: "bg-erro text-white border-erro hover:brightness-110",
  };
  return (
    <button
      type="button"
      {...resto}
      className={`inline-flex h-7 items-center gap-1.5 border px-3 text-[12px] disabled:cursor-not-allowed disabled:opacity-45 ${cores[variante]} ${className}`}
    >
      {icone && <Icone nome={icone} tamanho={15} />}
      {children}
    </button>
  );
}
