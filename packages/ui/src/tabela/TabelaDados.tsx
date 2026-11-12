/**
 * Tabela de dados — base para resultados, quantitativos, FlexTables,
 * planilha do Gantt, trechos de rede. Regras:
 *  - cabeçalho fixo e 1ª coluna fixa ao rolar;
 *  - números em mono, alinhados à direita, com unidade NO CABEÇALHO (não em cada célula);
 *  - ordenar clicando no cabeçalho; filtro por texto;
 *  - edição na célula com InputEngenharia (Enter desce, Tab anda, Esc cancela);
 *  - linha destacada (crítica/erro) por regra, não por cor solta;
 *  - total opcional no rodapé.
 */
import { useMemo, useRef, useState, type ReactNode } from "react";
import { formatarEngenharia } from "../base/parseEngenharia";
import { InputEngenharia } from "../base/InputEngenharia";
import { Icone } from "../base/icones";

export interface ColunaTabela<T> {
  id: keyof T & string;
  titulo: string;
  unidade?: string;
  tipo?: "numero" | "texto";
  casas?: number;
  largura?: number;
  editavel?: boolean;
  /** Soma no rodapé. */
  total?: boolean;
  render?: (linha: T) => ReactNode;
}

export function TabelaDados<T extends { id: string | number }>({
  colunas,
  linhas,
  onEditar,
  destaque,
  selecionada,
  onSelecionar,
  altura = 320,
}: {
  colunas: ColunaTabela<T>[];
  linhas: T[];
  onEditar?: (id: T["id"], coluna: keyof T & string, valor: number) => void;
  /** Retorna "erro" | "alerta" | "critico" para destacar a linha. */
  destaque?: (l: T) => "erro" | "alerta" | "critico" | null;
  selecionada?: T["id"] | null;
  onSelecionar?: (id: T["id"]) => void;
  altura?: number;
}) {
  const [ordem, setOrdem] = useState<{ col: string; asc: boolean } | null>(null);
  const [filtro, setFiltro] = useState("");
  const [editando, setEditando] = useState<{ l: number; c: number } | null>(null);
  const corpo = useRef<HTMLTableSectionElement>(null);

  const dados = useMemo(() => {
    let d = linhas;
    if (filtro) {
      const f = filtro.toLowerCase();
      d = d.filter((l) => colunas.some((c) => String(l[c.id] ?? "").toLowerCase().includes(f)));
    }
    if (ordem) {
      d = [...d].sort((a, b) => {
        const x = a[ordem.col as keyof T] as unknown;
        const y = b[ordem.col as keyof T] as unknown;
        const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR", { numeric: true });
        return ordem.asc ? r : -r;
      });
    }
    return d;
  }, [linhas, filtro, ordem, colunas]);

  const fmt = (c: ColunaTabela<T>, v: unknown) =>
    typeof v === "number" ? (c.casas !== undefined ? v.toLocaleString("pt-BR", { minimumFractionDigits: c.casas, maximumFractionDigits: c.casas }) : formatarEngenharia(v)) : String(v ?? "");

  const cores = { erro: "bg-erro-suave text-erro", alerta: "bg-[color-mix(in_srgb,var(--cr-alerta)_12%,transparent)]", critico: "shadow-[inset_3px_0_0_var(--cr-erro)] bg-erro-suave" };
  const temTotal = colunas.some((c) => c.total);

  function navegar(l: number, c: number, dir: "baixo" | "direita" | "esquerda") {
    const editaveis = colunas.map((x, i) => (x.editavel ? i : -1)).filter((i) => i >= 0);
    if (dir === "baixo") setEditando(l + 1 < dados.length ? { l: l + 1, c } : null);
    else {
      const k = editaveis.indexOf(c) + (dir === "direita" ? 1 : -1);
      setEditando(k >= 0 && k < editaveis.length ? { l, c: editaveis[k] } : null);
    }
  }

  return (
    <div className="flex flex-col border border-linha bg-painel">
      <div className="flex items-center gap-2 border-b border-linha px-2 py-1">
        <Icone nome="buscar" tamanho={14} className="text-texto-3" />
        <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar linhas…" className="h-6 flex-1 bg-transparent text-[12px] outline-none" />
        <span className="font-mono text-[11px] text-texto-3">
          {dados.length}/{linhas.length}
        </span>
      </div>
      <div className="overflow-auto" style={{ maxHeight: altura }}>
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-painel-2">
            <tr>
              {colunas.map((c, ci) => (
                <th
                  key={c.id}
                  style={{ width: c.largura }}
                  aria-sort={ordem?.col === c.id ? (ordem.asc ? "ascending" : "descending") : undefined}
                  className={`cursor-pointer select-none border-b border-r border-linha px-2 py-1 font-semibold text-texto-2 hover:text-texto ${c.tipo === "numero" ? "text-right" : "text-left"} ${ci === 0 ? "sticky left-0 z-20 bg-painel-2" : ""}`}
                  onClick={() => setOrdem((o) => (o?.col === c.id ? (o.asc ? { col: c.id, asc: false } : null) : { col: c.id, asc: true }))}
                >
                  {c.titulo}
                  {c.unidade && <span className="ml-1 font-mono text-[10px] font-normal text-texto-3">[{c.unidade}]</span>}
                  {ordem?.col === c.id && <span className="ml-1 text-acento">{ordem.asc ? "▲" : "▼"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={corpo}>
            {dados.map((l, li) => {
              const d = destaque?.(l);
              return (
                <tr
                  key={l.id}
                  onClick={() => onSelecionar?.(l.id)}
                  className={`${d ? cores[d] : ""} ${selecionada === l.id ? "!bg-acento-suave" : "hover:bg-painel-2"}`}
                >
                  {colunas.map((c, ci) => {
                    const v = l[c.id];
                    const ed = editando?.l === li && editando.c === ci;
                    return (
                      <td
                        key={c.id}
                        onDoubleClick={() => c.editavel && setEditando({ l: li, c: ci })}
                        className={`h-6 border-b border-r border-linha px-2 ${c.tipo === "numero" ? "text-right font-mono" : ""} ${ci === 0 ? "sticky left-0 bg-inherit" : ""} ${
                          c.editavel ? "cursor-text" : ""
                        } ${ed ? "p-0" : ""}`}
                      >
                        {ed ? (
                          <InputEngenharia
                            compacto
                            autoFocus
                            valor={v as number}
                            onChange={(_, r) => onEditar?.(l.id, c.id, r.valor)}
                            onCancelar={() => setEditando(null)}
                            onNavegar={(dir) => navegar(li, ci, dir)}
                          />
                        ) : c.render ? (
                          c.render(l)
                        ) : (
                          fmt(c, v)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          {temTotal && (
            <tfoot className="sticky bottom-0 bg-painel-2 font-semibold">
              <tr>
                {colunas.map((c, ci) => (
                  <td key={c.id} className={`border-t border-r border-linha-forte px-2 py-1 ${c.tipo === "numero" ? "text-right font-mono" : ""}`}>
                    {ci === 0 ? "Total" : c.total ? fmt(c, dados.reduce((s, l) => s + (Number(l[c.id]) || 0), 0)) : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="border-t border-linha px-2 py-0.5 text-[10px] text-texto-3">Duplo clique numa célula editável · Enter desce · Tab anda · Esc cancela</div>
    </div>
  );
}
