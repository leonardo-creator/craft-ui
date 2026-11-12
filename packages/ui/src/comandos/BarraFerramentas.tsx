/**
 * Barra de ferramentas flexível. Um componente, 6 comportamentos:
 *  1. posição: topo / esquerda / direita / flutuante (botões ou arrastar a alça);
 *  2. densidade: ícone+rótulo ou só ícone;
 *  3. personalizar: arrastar comandos da biblioteca, reordenar, remover, criar grupo;
 *  4. contextual: comandos da seleção atual aparecem num grupo roxo no fim;
 *  5. transbordo: o que não cabe vai para "Mais" (nunca quebra/espreme);
 *  6. tudo persiste por `id` (localStorage) e tem "Restaurar padrão".
 * A paleta Ctrl+K vem do mesmo registro (ver PaletaComandos).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icone } from "../base/icones";
import { BotaoComando, type Densidade } from "./BotaoComando";
import { gravarArmazenado, lerArmazenado, useComandos } from "./registro";

export type PosicaoBarra = "topo" | "esquerda" | "direita" | "flutuante";

export interface PreferenciasBarra {
  grupos: string[][];
  posicao: PosicaoBarra;
  densidade: Densidade;
  flutuante: { x: number; y: number };
}

export interface EstadoBarra extends PreferenciasBarra {
  definir: (p: Partial<PreferenciasBarra>) => void;
  restaurar: () => void;
}

/** Estado persistido da barra. O app passa o layout padrão; o usuário muda o resto. */
export function useBarraFerramentas(id: string, gruposPadrao: string[][], padrao?: Partial<PreferenciasBarra>): EstadoBarra {
  const inicial: PreferenciasBarra = {
    grupos: gruposPadrao,
    posicao: "topo",
    densidade: "rotulo",
    flutuante: { x: 80, y: 60 },
    ...padrao,
  };
  const chave = `craft-ui:barra:${id}`;
  const [p, setP] = useState<PreferenciasBarra>(() => ({ ...inicial, ...lerArmazenado<Partial<PreferenciasBarra>>(chave, {}) }));
  const definir = useCallback(
    (d: Partial<PreferenciasBarra>) =>
      setP((a) => {
        const n = { ...a, ...d };
        gravarArmazenado(chave, n);
        return n;
      }),
    [chave],
  );
  const restaurar = useCallback(() => {
    gravarArmazenado(chave, {});
    setP(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  return { ...p, definir, restaurar };
}

interface Props {
  estado: EstadoBarra;
  /** Tipo da seleção atual ("barra", "no", "tubo"...). Mostra os comandos com esse contexto. */
  contexto?: string | null;
  personalizando?: boolean;
  onPersonalizando?: (v: boolean) => void;
}

const LARGURA_MAIS = 44;

export function BarraFerramentas({ estado, contexto, personalizando = false, onPersonalizando }: Props) {
  const { comandos } = useComandos();
  const vertical = estado.posicao === "esquerda" || estado.posicao === "direita";
  const flutuante = estado.posicao === "flutuante";
  const caixa = useRef<HTMLDivElement>(null);
  const medida = useRef<HTMLDivElement>(null);
  const [ocultos, setOcultos] = useState<Set<string>>(new Set());
  const [menuMais, setMenuMais] = useState(false);
  const [alvoArrasto, setAlvoArrasto] = useState<string | null>(null);
  const [zonaArrasto, setZonaArrasto] = useState<PosicaoBarra | null>(null);

  const grupos = useMemo(
    () => estado.grupos.map((g) => g.filter((id) => comandos.has(id))).filter((g) => g.length),
    [estado.grupos, comandos],
  );
  const contextuais = useMemo(
    () => (contexto ? [...comandos.values()].filter((c) => c.contexto?.includes(contexto)).map((c) => c.id) : []),
    [contexto, comandos],
  );

  // Transbordo: mede numa camada invisível com TODOS os botões e calcula o que cabe.
  const recalcular = useCallback(() => {
    const cx = caixa.current;
    const md = medida.current;
    if (!cx || !md || flutuante || personalizando) {
      setOcultos(new Set());
      return;
    }
    const limite = (vertical ? cx.clientHeight : cx.clientWidth) - LARGURA_MAIS;
    const novos = new Set<string>();
    md.querySelectorAll<HTMLElement>("[data-medida]").forEach((el) => {
      const fim = vertical ? el.offsetTop + el.offsetHeight : el.offsetLeft + el.offsetWidth;
      if (fim > limite) novos.add(el.dataset.medida!);
    });
    setOcultos((a) => (a.size === novos.size && [...a].every((x) => novos.has(x)) ? a : novos));
  }, [vertical, flutuante, personalizando]);

  useLayoutEffect(recalcular, [recalcular, grupos, contextuais, estado.densidade]);
  useEffect(() => {
    const cx = caixa.current;
    if (!cx) return;
    const ro = new ResizeObserver(recalcular);
    ro.observe(cx);
    return () => ro.disconnect();
  }, [recalcular]);

  // ---- personalização (arrastar e soltar) ----
  function soltar(e: React.DragEvent, grupoDestino: number, antesDe?: string) {
    e.preventDefault();
    setAlvoArrasto(null);
    const id = e.dataTransfer.getData("text/craft-comando");
    if (!id) return;
    let gs = estado.grupos.map((g) => g.filter((x) => x !== id));
    if (grupoDestino >= gs.length) gs.push([id]);
    else {
      const g = [...gs[grupoDestino]];
      const pos = antesDe ? g.indexOf(antesDe) : -1;
      g.splice(pos < 0 ? g.length : pos, 0, id);
      gs[grupoDestino] = g;
    }
    gs = gs.filter((g) => g.length);
    estado.definir({ grupos: gs });
  }
  function remover(id: string) {
    estado.definir({ grupos: estado.grupos.map((g) => g.filter((x) => x !== id)).filter((g) => g.length) });
  }

  // ---- arrastar a barra para encaixar ----
  function iniciarArrasto(e: React.PointerEvent) {
    e.preventDefault();
    const area = caixa.current?.closest<HTMLElement>("[data-craft-area]");
    if (!area) return;
    const zona = (ev: PointerEvent): PosicaoBarra => {
      const r = area.getBoundingClientRect();
      if (ev.clientY < r.top + 56) return "topo";
      if (ev.clientX < r.left + 64) return "esquerda";
      if (ev.clientX > r.right - 64) return "direita";
      return "flutuante";
    };
    const mover = (ev: PointerEvent) => setZonaArrasto(zona(ev));
    const soltarBarra = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltarBarra);
      setZonaArrasto(null);
      const z = zona(ev);
      const r = area.getBoundingClientRect();
      estado.definir(z === "flutuante" ? { posicao: z, flutuante: { x: ev.clientX - r.left - 10, y: ev.clientY - r.top - 10 } } : { posicao: z });
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltarBarra);
    setZonaArrasto(zona(e.nativeEvent));
  }

  const sep = vertical ? "border-b border-linha py-1 flex-col" : "border-r border-linha px-1";
  const visiveis = grupos.map((g) => g.filter((id) => !ocultos.has(id))).filter((g) => g.length);
  const listaOcultos = grupos.flat().filter((id) => ocultos.has(id));

  const corpo = (
    <div
      ref={caixa}
      data-craft-barra=""
      role="toolbar"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      className={`relative flex border-linha bg-painel ${vertical ? "h-full flex-col border-x px-0.5 py-1" : "w-full items-stretch border-b px-1 py-0.5"} ${
        flutuante ? "!w-auto border shadow-flutuante" : ""
      } ${personalizando ? "outline-2 outline-offset-[-2px] outline-dashed outline-acento-borda" : ""}`}
      style={flutuante ? { position: "absolute", left: estado.flutuante.x, top: estado.flutuante.y, zIndex: 20, maxWidth: "calc(100% - 16px)", flexWrap: "wrap" } : undefined}
    >
      <div
        title="Arraste para encaixar no topo, nas laterais ou deixar flutuando"
        onPointerDown={iniciarArrasto}
        className={`shrink-0 cursor-grab text-texto-3 hover:text-texto-2 ${vertical ? "mb-1 flex h-3 justify-center" : "mr-1 flex w-3 items-center"}`}
      >
        <Icone nome="arrastar" tamanho={12} className={vertical ? "rotate-90" : ""} />
      </div>
      {visiveis.map((g, gi) => (
        <div
          key={gi}
          className={`flex shrink-0 items-center gap-0.5 ${sep} last:border-0 ${alvoArrasto === `g${gi}` ? "bg-acento-suave" : ""}`}
          onDragOver={(e) => {
            if (!personalizando) return;
            e.preventDefault();
            setAlvoArrasto(`g${gi}`);
          }}
          onDragLeave={() => setAlvoArrasto(null)}
          onDrop={(e) => soltar(e, estado.grupos.findIndex((x) => x.includes(g[0])), (e.target as HTMLElement).closest<HTMLElement>("[data-comando]")?.dataset.comando)}
        >
          {g.map((id) => (
            <BotaoComando
              key={id}
              id={id}
              densidade={estado.densidade}
              grande={!vertical && estado.densidade === "rotulo"}
              draggable={personalizando}
              onDragStart={(e) => e.dataTransfer.setData("text/craft-comando", id)}
              extra={
                personalizando ? (
                  <span
                    role="button"
                    aria-label={`Remover ${id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      remover(id);
                    }}
                    className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-erro text-[9px] text-white"
                  >
                    ✕
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      ))}
      {personalizando && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setAlvoArrasto("novo");
          }}
          onDragLeave={() => setAlvoArrasto(null)}
          onDrop={(e) => soltar(e, Number.MAX_SAFE_INTEGER)}
          className={`flex min-h-8 min-w-16 shrink-0 items-center justify-center border border-dashed border-acento-borda px-2 text-[11px] text-texto-3 ${alvoArrasto === "novo" ? "bg-acento-suave" : ""}`}
        >
          + grupo
        </div>
      )}
      {contextuais.length > 0 && !personalizando && (
        <div className={`flex shrink-0 items-center gap-0.5 bg-contexto-suave ${vertical ? "flex-col py-1" : "px-1"}`} aria-label="Comandos da seleção">
          {contextuais.map((id) => (
            <BotaoComando key={id} id={id} densidade={estado.densidade} grande={!vertical && estado.densidade === "rotulo"} contextual />
          ))}
        </div>
      )}
      {listaOcultos.length > 0 && (
        <div className={`relative ${vertical ? "mt-auto" : "ml-auto"} flex shrink-0 items-center`}>
          <button
            type="button"
            title={`${listaOcultos.length} comando(s) que não couberam`}
            aria-haspopup="menu"
            aria-expanded={menuMais}
            onClick={() => setMenuMais((m) => !m)}
            className="flex h-8 w-9 items-center justify-center border border-transparent text-texto hover:border-acento-borda hover:bg-acento-suave"
          >
            <Icone nome="mais" tamanho={20} />
            <span className="absolute right-0.5 top-0.5 rounded-sm bg-acento px-0.5 font-mono text-[9px] leading-tight text-white">{listaOcultos.length}</span>
          </button>
          {menuMais && (
            <div
              role="menu"
              onClick={() => setMenuMais(false)}
              className={`absolute z-30 flex min-w-44 flex-col border border-linha bg-painel p-1 shadow-flutuante ${vertical ? "bottom-0 left-full ml-1" : "right-0 top-full mt-1"}`}
            >
              {listaOcultos.map((id) => (
                <BotaoComando key={id} id={id} densidade="rotulo" />
              ))}
            </div>
          )}
        </div>
      )}
      {onPersonalizando && !personalizando && !flutuante && (
        <button
          type="button"
          title="Personalizar barra"
          onClick={() => onPersonalizando(true)}
          className={`${listaOcultos.length ? "" : vertical ? "mt-auto" : "ml-auto"} flex h-8 w-8 shrink-0 items-center justify-center self-center text-texto-3 hover:text-texto`}
        >
          <Icone nome="config" tamanho={15} />
        </button>
      )}

      {/* camada de medida (invisível) — mesma renderização, todos os botões */}
      <div ref={medida} aria-hidden className={`pointer-events-none invisible absolute left-0 top-0 flex ${vertical ? "flex-col" : ""}`}>
        <div className={vertical ? "h-4" : "w-4"} />
        {grupos.map((g, gi) => (
          <div key={gi} className={`flex shrink-0 items-center gap-0.5 ${sep}`}>
            {g.map((id) => (
              <span key={id} data-medida={id} className="inline-flex">
                <BotaoComando id={id} densidade={estado.densidade} grande={!vertical && estado.densidade === "rotulo"} />
              </span>
            ))}
          </div>
        ))}
      </div>

      {zonaArrasto && <IndicadorZona zona={zonaArrasto} />}
    </div>
  );

  return (
    <>
      {corpo}
      {personalizando && <BibliotecaComandos estado={estado} onFechar={() => onPersonalizando?.(false)} />}
    </>
  );
}

function IndicadorZona({ zona }: { zona: PosicaoBarra }) {
  const txt = { topo: "Soltar: encaixar no topo", esquerda: "Soltar: encaixar à esquerda", direita: "Soltar: encaixar à direita", flutuante: "Soltar: barra flutuante" }[zona];
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 bg-texto px-3 py-1 text-[12px] text-painel shadow-flutuante">{txt}</div>
  );
}

function BibliotecaComandos({ estado, onFechar }: { estado: EstadoBarra; onFechar: () => void }) {
  const { comandos } = useComandos();
  const [filtro, setFiltro] = useState("");
  const naBarra = new Set(estado.grupos.flat());
  const porCategoria = new Map<string, string[]>();
  for (const c of comandos.values()) {
    if (filtro && !c.rotulo.toLowerCase().includes(filtro.toLowerCase())) continue;
    const k = c.categoria ?? "Outros";
    porCategoria.set(k, [...(porCategoria.get(k) ?? []), c.id]);
  }
  return (
    <div
      className="absolute right-3 top-14 z-40 flex max-h-[70%] w-72 flex-col border border-linha bg-painel shadow-flutuante"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/craft-comando");
        if (id) estado.definir({ grupos: estado.grupos.map((g) => g.filter((x) => x !== id)).filter((g) => g.length) });
      }}
    >
      <div className="border-b border-linha p-2">
        <div className="mb-1 text-[12px] font-semibold">Personalizar barra</div>
        <p className="mb-2 text-[11px] text-texto-3">Arraste para a barra. Arraste de volta para cá (ou ✕) para remover.</p>
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar comandos…"
          className="h-7 w-full border border-linha-forte bg-painel px-2 text-[12px] outline-none focus:border-acento"
        />
      </div>
      <div className="flex-1 overflow-auto p-2">
        {[...porCategoria].map(([cat, ids]) => (
          <div key={cat} className="mb-2">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-texto-3">{cat}</div>
            <div className="flex flex-wrap gap-1">
              {ids.map((id) => (
                <span key={id} className={`border ${naBarra.has(id) ? "border-acento-borda opacity-50" : "border-linha"}`}>
                  <BotaoComando id={id} densidade="rotulo" draggable onDragStart={(e) => e.dataTransfer.setData("text/craft-comando", id)} />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 border-t border-linha p-2">
        <button type="button" onClick={estado.restaurar} className="h-7 flex-1 border border-linha-forte text-[12px] hover:bg-acento-suave">
          Restaurar padrão
        </button>
        <button type="button" onClick={onFechar} className="h-7 flex-1 border border-acento bg-acento text-[12px] text-white">
          Concluir
        </button>
      </div>
    </div>
  );
}
