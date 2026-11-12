/**
 * Árvore de elementos (pavimentos, disciplinas, grupos, cenários) e grade de
 * propriedades. Teclado completo na árvore (↑↓ anda, → abre, ← fecha, Enter
 * seleciona) e busca que mantém os pais do que casou visíveis.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Icone, type NomeIcone } from "../base/icones";
import { InputEngenharia, type UnidadeComprimento } from "../base/InputEngenharia";

export interface NoArvore {
  id: string;
  rotulo: string;
  icone?: NomeIcone;
  /** Contagem/valor à direita (ex.: "12 barras"). */
  info?: string;
  filhos?: NoArvore[];
  /** Visibilidade (olho) — quando definido aparece o alternador. */
  visivel?: boolean;
}

export function Arvore({
  nos,
  selecionado,
  onSelecionar,
  onVisibilidade,
}: {
  nos: NoArvore[];
  selecionado?: string | null;
  onSelecionar?: (id: string) => void;
  onVisibilidade?: (id: string, v: boolean) => void;
}) {
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set(nos.map((n) => n.id)));
  const [filtro, setFiltro] = useState("");

  const visiveis = useMemo(() => {
    const out: { no: NoArvore; nivel: number }[] = [];
    const f = filtro.trim().toLowerCase();
    const casa = (n: NoArvore): boolean => !f || n.rotulo.toLowerCase().includes(f) || (n.filhos ?? []).some(casa);
    const andar = (lista: NoArvore[], nivel: number) => {
      for (const n of lista) {
        if (!casa(n)) continue;
        out.push({ no: n, nivel });
        if (n.filhos && (abertos.has(n.id) || f)) andar(n.filhos, nivel + 1);
      }
    };
    andar(nos, 0);
    return out;
  }, [nos, abertos, filtro]);

  const alternar = (id: string, abrir?: boolean) =>
    setAbertos((a) => {
      const n = new Set(a);
      if (abrir ?? !n.has(id)) n.add(id);
      else n.delete(id);
      return n;
    });

  function tecla(e: React.KeyboardEvent) {
    const i = visiveis.findIndex((v) => v.no.id === selecionado);
    const atual = visiveis[i]?.no;
    if (e.key === "ArrowDown") onSelecionar?.(visiveis[Math.min(i + 1, visiveis.length - 1)].no.id);
    else if (e.key === "ArrowUp") onSelecionar?.(visiveis[Math.max(i - 1, 0)].no.id);
    else if (e.key === "ArrowRight" && atual?.filhos) alternar(atual.id, true);
    else if (e.key === "ArrowLeft" && atual?.filhos) alternar(atual.id, false);
    else return;
    e.preventDefault();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-linha p-1.5">
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar…"
          className="h-6 w-full border border-linha bg-painel px-2 text-[12px] outline-none focus:border-acento"
        />
      </div>
      <ul role="tree" tabIndex={0} onKeyDown={tecla} className="flex-1 overflow-auto py-1 outline-none">
        {visiveis.map(({ no, nivel }) => (
          <li
            key={no.id}
            role="treeitem"
            aria-selected={no.id === selecionado}
            aria-expanded={no.filhos ? abertos.has(no.id) : undefined}
            onClick={() => onSelecionar?.(no.id)}
            style={{ paddingLeft: 4 + nivel * 14 }}
            className={`group flex h-6 cursor-default items-center gap-1 pr-2 text-[12px] ${no.id === selecionado ? "bg-acento-suave text-acento" : "hover:bg-painel-2"}`}
          >
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                if (no.filhos) alternar(no.id);
              }}
              className={`flex h-4 w-4 items-center justify-center text-texto-3 ${no.filhos ? "" : "invisible"}`}
            >
              <Icone nome="seta" tamanho={11} className={abertos.has(no.id) || filtro ? "rotate-90" : ""} />
            </button>
            {no.icone && <Icone nome={no.icone} tamanho={14} className="text-texto-2" />}
            <span className="min-w-0 flex-1 truncate">{no.rotulo}</span>
            {no.info && <span className="font-mono text-[10px] text-texto-3">{no.info}</span>}
            {no.visivel !== undefined && (
              <button
                type="button"
                tabIndex={-1}
                title={no.visivel ? "Ocultar" : "Mostrar"}
                onClick={(e) => {
                  e.stopPropagation();
                  onVisibilidade?.(no.id, !no.visivel);
                }}
                className={`text-[11px] ${no.visivel ? "text-texto-3 opacity-0 group-hover:opacity-100" : "text-texto-3 line-through"}`}
              >
                {no.visivel ? "👁" : "oculto"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface Propriedade {
  id: string;
  rotulo: string;
  grupo?: string;
  valor: number | string;
  /** "numero" usa InputEngenharia; "texto" só exibe; "opcao" usa <select>. */
  tipo?: "numero" | "texto" | "opcao";
  unidade?: UnidadeComprimento;
  sufixo?: string;
  opcoes?: string[];
  somenteLeitura?: boolean;
  /** Valor misto (seleção múltipla com valores diferentes). */
  misto?: boolean;
}

/** Grade de propriedades: o lugar de editar a seleção sem abrir diálogo. */
export function GradePropriedades({
  titulo,
  props,
  onChange,
  vazio = "Selecione um elemento para ver as propriedades.",
}: {
  titulo?: ReactNode;
  props: Propriedade[];
  onChange?: (id: string, valor: number | string) => void;
  vazio?: string;
}) {
  if (!props.length) return <p className="p-3 text-[12px] text-texto-3">{vazio}</p>;
  const grupos = new Map<string, Propriedade[]>();
  props.forEach((p) => grupos.set(p.grupo ?? "Geral", [...(grupos.get(p.grupo ?? "Geral") ?? []), p]));
  return (
    <div className="text-[12px]">
      {titulo && <div className="border-b border-linha px-2 py-1.5 font-semibold">{titulo}</div>}
      {[...grupos].map(([g, ps]) => (
        <section key={g}>
          <div className="bg-painel-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-texto-3">{g}</div>
          {ps.map((p) => (
            <div key={p.id} className="grid grid-cols-[45%_55%] items-center border-b border-linha">
              <span className="truncate px-2 py-1 text-texto-2" title={p.rotulo}>
                {p.rotulo}
              </span>
              <span className="px-1 py-0.5">
                {p.tipo === "opcao" ? (
                  <select
                    value={String(p.valor)}
                    disabled={p.somenteLeitura}
                    onChange={(e) => onChange?.(p.id, e.target.value)}
                    className="h-6 w-full border border-linha-forte bg-painel px-1 text-[12px]"
                  >
                    {p.opcoes?.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : p.tipo === "texto" || p.somenteLeitura ? (
                  <span className="block truncate px-1 font-mono text-[12px] text-texto">{String(p.valor)}</span>
                ) : (
                  <InputEngenharia
                    compacto
                    valor={p.misto ? "" : p.valor}
                    placeholder={p.misto ? "(vários)" : undefined}
                    unidadeCampo={p.unidade}
                    sufixo={p.sufixo}
                    onChange={(_, r) => onChange?.(p.id, r.valor)}
                  />
                )}
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
