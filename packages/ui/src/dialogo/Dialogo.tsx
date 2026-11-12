/**
 * Diálogo único — substitui ~129 modais feitos à mão (`fixed inset-0` em
 * cada frente, cada um com teclado/foco diferente). Garantias:
 *  - Enter confirma (é um <form>), Esc cancela, foco preso dentro;
 *  - foco volta para quem abriu ao fechar;
 *  - erro de validação numa faixa fixa acima dos botões (não some atrás do campo);
 *  - `modal={false}`: painel flutuante NÃO bloqueia o desenho — dá para
 *    clicar no modelo com o diálogo aberto (Propriedades, Vento, Seções…);
 *  - arrastável pelo título; lembra a posição por `id`;
 *  - botão primário único e à direita; o perigoso nunca é o padrão.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Botao } from "../base/Campos";
import { Icone } from "../base/icones";
import { gravarArmazenado, lerArmazenado } from "../comandos/registro";

export interface DialogoProps {
  aberto: boolean;
  titulo: ReactNode;
  /** Linha abaixo do título (norma, contexto). */
  subtitulo?: ReactNode;
  children: ReactNode;
  onFechar: () => void;
  /** Se informado, o diálogo é um formulário: Enter chama onConfirmar. */
  onConfirmar?: () => void;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  /** Mensagem de erro de validação (faixa vermelha fixa). */
  erro?: string | null;
  largura?: "p" | "m" | "g";
  /** false = flutuante, não bloqueia a tela. */
  modal?: boolean;
  /** Chave para lembrar posição (diálogos não modais). */
  id?: string;
  /** Botões extras à esquerda do rodapé (ex.: "Padrões"). */
  rodapeEsquerda?: ReactNode;
  confirmarDesabilitado?: boolean;
}

const LARGURAS = { p: 360, m: 520, g: 760 };

export function Dialogo({
  aberto,
  titulo,
  subtitulo,
  children,
  onFechar,
  onConfirmar,
  rotuloConfirmar = "OK",
  rotuloCancelar = "Cancelar",
  erro,
  largura = "m",
  modal = true,
  id,
  rodapeEsquerda,
  confirmarDesabilitado,
}: DialogoProps) {
  const caixa = useRef<HTMLFormElement>(null);
  const idTitulo = useId();
  const chave = id ? `craft-ui:dialogo:${id}` : null;
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => (chave ? lerArmazenado(chave, null) : null));

  // Foco: entra no primeiro campo, volta para quem abriu.
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const el = caixa.current?.querySelector<HTMLElement>("[autofocus], input, select, textarea, button:not([data-fechar])");
      el?.focus();
    }, 0);
    return () => {
      clearTimeout(t);
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto) return null;

  function tecla(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onFechar();
    }
    if (e.key === "Tab" && modal) {
      const foc = caixa.current?.querySelectorAll<HTMLElement>("input, select, textarea, button, [tabindex]:not([tabindex='-1'])");
      if (!foc?.length) return;
      const prim = foc[0];
      const ult = foc[foc.length - 1];
      if (e.shiftKey && document.activeElement === prim) {
        e.preventDefault();
        ult.focus();
      } else if (!e.shiftKey && document.activeElement === ult) {
        e.preventDefault();
        prim.focus();
      }
    }
  }

  function enviar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirmarDesabilitado) onConfirmar?.();
  }

  function arrastar(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    const r = caixa.current!.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    const mover = (ev: PointerEvent) =>
      setPos({ x: Math.max(0, Math.min(window.innerWidth - 120, ev.clientX - dx)), y: Math.max(0, Math.min(window.innerHeight - 40, ev.clientY - dy)) });
    const soltar = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      if (chave) gravarArmazenado(chave, { x: ev.clientX - dx, y: ev.clientY - dy });
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  const estilo: React.CSSProperties = { width: `min(${LARGURAS[largura]}px, calc(100vw - 24px))` };
  if (pos) Object.assign(estilo, { position: "fixed", left: pos.x, top: pos.y });

  const janela = (
    <form
      ref={caixa}
      role="dialog"
      aria-modal={modal}
      aria-labelledby={idTitulo}
      onSubmit={enviar}
      onKeyDown={tecla}
      style={estilo}
      className={`flex max-h-[calc(100vh-48px)] flex-col border border-linha-forte bg-painel shadow-flutuante ${
        !pos && !modal ? "fixed right-6 top-20" : ""
      } z-[80]`}
    >
      <header onPointerDown={arrastar} className="flex cursor-move select-none items-start gap-2 border-b border-linha bg-painel-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <h2 id={idTitulo} className="text-[13px] font-semibold text-texto">
            {titulo}
          </h2>
          {subtitulo && <p className="mt-0.5 text-[11px] text-texto-3">{subtitulo}</p>}
        </div>
        <button type="button" data-fechar onClick={onFechar} title="Fechar (Esc)" className="flex h-6 w-6 items-center justify-center text-texto-3 hover:text-texto">
          <Icone nome="fechar" tamanho={15} />
        </button>
      </header>
      <div className="flex-1 overflow-auto px-3 py-2">{children}</div>
      {erro && (
        <div role="alert" className="flex items-center gap-2 border-t border-erro/30 bg-erro-suave px-3 py-1.5 text-[12px] text-erro">
          <Icone nome="alerta" tamanho={15} /> {erro}
        </div>
      )}
      <footer className="flex items-center gap-2 border-t border-linha px-3 py-2">
        {rodapeEsquerda}
        <span className="flex-1" />
        <Botao type="button" onClick={onFechar}>
          {rotuloCancelar}
        </Botao>
        {onConfirmar && (
          <Botao type="submit" variante="primario" disabled={confirmarDesabilitado}>
            {rotuloConfirmar}
          </Botao>
        )}
      </footer>
    </form>
  );

  if (!modal) return janela;
  return (
    <div className="fixed inset-0 z-[79] flex items-center justify-center bg-black/30" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      {janela}
    </div>
  );
}
