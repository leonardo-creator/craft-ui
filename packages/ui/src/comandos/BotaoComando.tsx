import type { ReactNode } from "react";
import { Icone } from "../base/icones";
import { useComandos } from "./registro";

export type Densidade = "rotulo" | "icone";

/** Botão que só conhece o id do comando — rótulo, ícone, atalho e estado vêm do registro. */
export function BotaoComando({
  id,
  densidade = "rotulo",
  grande,
  contextual,
  extra,
  draggable,
  onDragStart,
}: {
  id: string;
  densidade?: Densidade;
  /** Botão alto (ribbon). */
  grande?: boolean;
  contextual?: boolean;
  extra?: ReactNode;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const { comandos, executar } = useComandos();
  const c = comandos.get(id);
  if (!c) return null;
  const titulo = `${c.rotulo}${c.atalho ? `  (${c.atalho})` : ""}${c.descricao ? `\n${c.descricao}` : ""}`;
  const cor = c.ativo
    ? "bg-acento-suave border-acento-borda text-acento"
    : contextual
      ? "text-contexto border-transparent hover:bg-contexto-suave"
      : "text-texto border-transparent hover:bg-acento-suave hover:border-acento-borda";
  const forma =
    densidade === "icone"
      ? "h-8 w-8 justify-center"
      : grande
        ? "min-w-[54px] flex-col justify-center gap-0.5 px-1.5 py-1"
        : "h-8 gap-1.5 px-2";
  return (
    <button
      type="button"
      data-comando={id}
      title={titulo}
      aria-label={c.rotulo}
      aria-pressed={c.ativo ?? undefined}
      disabled={c.habilitado === false}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={() => executar(id)}
      className={`relative inline-flex shrink-0 items-center border text-[11px] disabled:cursor-not-allowed disabled:opacity-40 ${forma} ${cor}`}
    >
      {c.icone && <Icone nome={c.icone} tamanho={grande && densidade !== "icone" ? 22 : 17} />}
      {densidade !== "icone" && <span className="whitespace-nowrap leading-tight">{c.rotulo}</span>}
      {extra}
    </button>
  );
}
