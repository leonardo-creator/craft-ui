/**
 * Ribbon guiado por dados — substitui as 6 cópias de `Ribbon.tsx` (252 a
 * 1815 linhas cada, um callback por botão). Aqui as guias são DADO
 * (ids de comandos) e o ribbon:
 *  - mostra guia CONTEXTUAL colorida quando há seleção (ex.: "Barra");
 *  - recolhe grupos que não cabem em um botão-menu (da direita p/ a esquerda);
 *  - pode ser minimizado (duplo clique na guia ou Ctrl+F1) e lembra disso;
 *  - lembra a última guia aberta.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icone } from "../base/icones";
import { BotaoComando } from "./BotaoComando";
import { gravarArmazenado, lerArmazenado, useComandos } from "./registro";

export interface GrupoRibbon {
  rotulo: string;
  comandos: string[];
}
export interface GuiaRibbon {
  id: string;
  rotulo: string;
  grupos: GrupoRibbon[];
}

export function Ribbon({
  id,
  guias,
  guiasContextuais = {},
  contexto,
  aDireita,
}: {
  /** Chave de persistência. */
  id: string;
  guias: GuiaRibbon[];
  /** Guia extra por tipo de seleção: { barra: {...}, no: {...} }. */
  guiasContextuais?: Record<string, GuiaRibbon>;
  contexto?: string | null;
  /** Conteúdo no canto direito da linha de guias (busca, usuário...). */
  aDireita?: React.ReactNode;
}) {
  const chave = `craft-ui:ribbon:${id}`;
  const salvo = lerArmazenado<{ guia?: string; minimizado?: boolean }>(chave, {});
  const [guiaAtual, setGuia] = useState(salvo.guia ?? guias[0]?.id);
  const [minimizado, setMinimizado] = useState(!!salvo.minimizado);
  const [recolhidos, setRecolhidos] = useState(0);
  const [menuGrupo, setMenuGrupo] = useState<number | null>(null);
  const faixa = useRef<HTMLDivElement>(null);
  const { abrirPaleta } = useComandos();

  const ctx = contexto ? guiasContextuais[contexto] : undefined;
  const todas = ctx ? [...guias, { ...ctx, id: `ctx:${ctx.id}` }] : guias;
  const guia = todas.find((g) => g.id === guiaAtual) ?? todas[0];

  // Ao selecionar algo com guia contextual, abre a guia contextual.
  useEffect(() => {
    if (ctx) setGuia(`ctx:${ctx.id}`);
    else if (guiaAtual?.startsWith("ctx:")) setGuia(guias[0]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto]);

  useEffect(() => {
    if (!guiaAtual?.startsWith("ctx:")) gravarArmazenado(chave, { guia: guiaAtual, minimizado });
  }, [chave, guiaAtual, minimizado]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "F1") {
        e.preventDefault();
        setMinimizado((m) => !m);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  // Recolhe grupos do fim enquanto a faixa transbordar.
  useLayoutEffect(() => setRecolhidos(0), [guia?.id]);
  useLayoutEffect(() => {
    const el = faixa.current;
    if (!el || !guia) return;
    if (el.scrollWidth > el.clientWidth + 1 && recolhidos < guia.grupos.length) setRecolhidos((r) => r + 1);
  });
  useEffect(() => {
    const el = faixa.current;
    if (!el) return;
    let largura = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > largura) setRecolhidos(0);
      largura = el.clientWidth;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!guia) return null;
  const nAbertos = guia.grupos.length - recolhidos;
  const ehCtx = guia.id.startsWith("ctx:");

  return (
    <div className="border-b border-linha bg-painel" data-craft-ribbon="">
      <div role="tablist" className="flex items-end gap-0.5 border-b border-linha bg-painel-2 px-2 pt-1">
        {todas.map((g) => {
          const c = g.id.startsWith("ctx:");
          const ativa = g.id === guia.id;
          return (
            <button
              key={g.id}
              role="tab"
              aria-selected={ativa}
              onClick={() => {
                setGuia(g.id);
                if (minimizado) setMinimizado(false);
              }}
              onDoubleClick={() => setMinimizado((m) => !m)}
              className={`relative -mb-px border border-b-0 px-3 py-1 text-[11px] font-medium tracking-wide ${
                ativa ? "border-linha bg-painel text-texto" : "border-transparent text-texto-2 hover:text-texto"
              } ${c ? "text-contexto" : ""}`}
            >
              {c && <span className="absolute inset-x-0 top-0 h-0.5 bg-contexto" />}
              {g.rotulo}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 pb-1">
          {aDireita}
          <button
            type="button"
            onClick={() => abrirPaleta(true)}
            className="flex h-6 items-center gap-2 border border-linha bg-painel px-2 text-[11px] text-texto-3 hover:border-acento-borda"
            title="Buscar qualquer comando"
          >
            <Icone nome="buscar" tamanho={13} /> Buscar comando <kbd>Ctrl</kbd>
            <kbd>K</kbd>
          </button>
          <button
            type="button"
            title={minimizado ? "Expandir ribbon (Ctrl+F1)" : "Minimizar ribbon (Ctrl+F1)"}
            onClick={() => setMinimizado((m) => !m)}
            className="flex h-6 w-6 items-center justify-center text-texto-3 hover:text-texto"
          >
            <Icone nome="setaBaixo" tamanho={14} className={minimizado ? "" : "rotate-180"} />
          </button>
        </div>
      </div>
      {!minimizado && (
        <div ref={faixa} className={`flex h-[78px] items-stretch overflow-hidden px-1 ${ehCtx ? "bg-contexto-suave" : ""}`}>
          {guia.grupos.slice(0, nAbertos).map((gr) => (
            <div key={gr.rotulo} className="flex shrink-0 flex-col border-r border-linha px-1">
              <div className="flex flex-1 items-center gap-0.5">
                {gr.comandos.map((id) => (
                  <BotaoComando key={id} id={id} grande contextual={ehCtx} />
                ))}
              </div>
              <div className="pb-0.5 text-center text-[10px] text-texto-3">{gr.rotulo}</div>
            </div>
          ))}
          {guia.grupos.slice(nAbertos).map((gr, i) => (
            <div key={gr.rotulo} className="relative flex shrink-0 flex-col border-r border-linha px-1">
              <button
                type="button"
                onClick={() => setMenuGrupo(menuGrupo === i ? null : i)}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 px-2 text-[11px] hover:bg-acento-suave"
              >
                <Icone nome="setaBaixo" tamanho={18} />
                {gr.rotulo}
              </button>
              {menuGrupo === i && (
                <div onClick={() => setMenuGrupo(null)} className="fixed z-40 mt-[70px] flex flex-col border border-linha bg-painel p-1 shadow-flutuante">
                  {gr.comandos.map((id) => (
                    <BotaoComando key={id} id={id} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
