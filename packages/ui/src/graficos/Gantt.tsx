/**
 * Gantt — base da tela principal da 04 (Gantt.tsx 623 linhas + PlanilhaGantt
 * 3.076) e de cronogramas nas outras frentes. Antes: escala fixa, régua feita
 * à mão. Aqui:
 *  - coluna de tarefas FIXA à esquerda, rolagem sincronizada;
 *  - régua de tempo em 2 níveis que muda com o zoom (dias → semanas → meses);
 *  - Ctrl+roda = zoom no tempo; botões −/+ e "Hoje";
 *  - setas de dependência (TI) ortogonais; caminho crítico em vermelho;
 *  - marcos (losango), resumos (colchete) com recolher/expandir, linha de base;
 *  - progresso dentro da barra; linha "hoje";
 *  - ARRASTAR a barra move a tarefa, arrastar a borda direita muda a duração
 *    (encaixa em dia inteiro) → onAlterar(id, inicio, duracao).
 * Datas são DIAS a partir de `inicio` (ISO): o motor do app continua dono do calendário.
 */
import { useMemo, useRef, useState } from "react";
import { Icone } from "../base/icones";
import { dataDoDia, marcasTempo, nivelTempo } from "./escalas";

export interface TarefaGantt {
  id: string;
  nome: string;
  /** Dia de início (0 = data `inicio` do projeto). */
  inicio: number;
  duracao: number;
  /** 0..1 */
  progresso?: number;
  predecessoras?: string[];
  marco?: boolean;
  resumo?: boolean;
  /** Nível de recuo (0 = raiz). Filhos de um resumo vêm logo depois dele com nível maior. */
  nivel?: number;
  linhaBase?: { inicio: number; duracao: number };
}

/** Caminho crítico por folga total zero (passagem de ida dada pelas datas, volta calculada). */
export function caminhoCritico(tarefas: Pick<TarefaGantt, "id" | "inicio" | "duracao" | "predecessoras">[]): Set<string> {
  const fim = Math.max(...tarefas.map((t) => t.inicio + t.duracao));
  const sucessoras = new Map<string, string[]>();
  tarefas.forEach((t) => t.predecessoras?.forEach((p) => sucessoras.set(p, [...(sucessoras.get(p) ?? []), t.id])));
  const porId = new Map(tarefas.map((t) => [t.id, t]));
  const ls = new Map<string, number>();
  const calcLs = (id: string): number => {
    if (ls.has(id)) return ls.get(id)!;
    const t = porId.get(id)!;
    const suc = sucessoras.get(id) ?? [];
    const lf = suc.length ? Math.min(...suc.map(calcLs)) : fim;
    const v = lf - t.duracao;
    ls.set(id, v);
    return v;
  };
  const crit = new Set<string>();
  tarefas.forEach((t) => {
    if (calcLs(t.id) - t.inicio <= 1e-9) crit.add(t.id);
  });
  return crit;
}

const ALT = 26;

export function Gantt({
  inicio,
  tarefas,
  hoje,
  selecionada,
  onSelecionar,
  onAlterar,
  altura = 360,
  mostrarCritico = true,
  mostrarLinhaBase = true,
}: {
  inicio: string;
  tarefas: TarefaGantt[];
  hoje?: number;
  selecionada?: string | null;
  onSelecionar?: (id: string) => void;
  onAlterar?: (id: string, inicio: number, duracao: number) => void;
  altura?: number;
  mostrarCritico?: boolean;
  mostrarLinhaBase?: boolean;
}) {
  const [pxDia, setPxDia] = useState(14);
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());
  const [arrasto, setArrasto] = useState<{ id: string; modo: "mover" | "duracao"; x0: number; ini: number; dur: number; atual: { ini: number; dur: number } } | null>(null);
  const rolagem = useRef<HTMLDivElement>(null);

  const criticas = useMemo(() => (mostrarCritico ? caminhoCritico(tarefas.filter((t) => !t.resumo)) : new Set<string>()), [tarefas, mostrarCritico]);

  // visíveis (respeitando resumos recolhidos)
  const visiveis = useMemo(() => {
    const out: TarefaGantt[] = [];
    let escondeAte: number | null = null;
    for (const t of tarefas) {
      const nv = t.nivel ?? 0;
      if (escondeAte != null && nv > escondeAte) continue;
      escondeAte = null;
      out.push(t);
      if (t.resumo && recolhidos.has(t.id)) escondeAte = nv;
    }
    return out;
  }, [tarefas, recolhidos]);

  const geo = (t: TarefaGantt) => (arrasto?.id === t.id ? { ini: arrasto.atual.ini, dur: arrasto.atual.dur } : { ini: t.inicio, dur: t.duracao });
  const fimProj = Math.max(...tarefas.map((t) => t.inicio + t.duracao), hoje ?? 0) + 7;
  const iniProj = Math.min(0, ...tarefas.map((t) => t.inicio)) - 3;
  const X = (d: number) => (d - iniProj) * pxDia;
  const largura = X(fimProj);
  const nivel = nivelTempo(pxDia);
  const ticks = marcasTempo(inicio, iniProj, fimProj, nivel);
  const meses = marcasTempo(inicio, iniProj, fimProj, "mes");
  const linha = new Map(visiveis.map((t, i) => [t.id, i]));

  function iniciarArrasto(e: React.PointerEvent, t: TarefaGantt, modo: "mover" | "duracao") {
    if (!onAlterar || t.resumo) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setArrasto({ id: t.id, modo, x0: e.clientX, ini: t.inicio, dur: t.duracao, atual: { ini: t.inicio, dur: t.duracao } });
  }
  function moverArrasto(e: React.PointerEvent) {
    if (!arrasto) return;
    const dd = Math.round((e.clientX - arrasto.x0) / pxDia);
    setArrasto({ ...arrasto, atual: arrasto.modo === "mover" ? { ini: arrasto.ini + dd, dur: arrasto.dur } : { ini: arrasto.ini, dur: Math.max(1, arrasto.dur + dd) } });
  }
  function soltarArrasto() {
    if (arrasto && (arrasto.atual.ini !== arrasto.ini || arrasto.atual.dur !== arrasto.dur)) onAlterar?.(arrasto.id, arrasto.atual.ini, arrasto.atual.dur);
    setArrasto(null);
  }
  const zoom = (f: number) => setPxDia((p) => Math.max(1.2, Math.min(60, p * f)));
  const irHoje = () => rolagem.current?.scrollTo({ left: Math.max(0, X(hoje ?? 0) - 120), behavior: "smooth" });

  return (
    <div className="flex flex-col border border-linha bg-painel text-[12px]">
      <div className="flex items-center gap-1 border-b border-linha px-2 py-1">
        <button type="button" title="Afastar (Ctrl+roda)" onClick={() => zoom(1 / 1.4)} className="flex h-6 w-6 items-center justify-center border border-linha-forte hover:bg-acento-suave">
          −
        </button>
        <button type="button" title="Aproximar (Ctrl+roda)" onClick={() => zoom(1.4)} className="flex h-6 w-6 items-center justify-center border border-linha-forte hover:bg-acento-suave">
          +
        </button>
        <span className="ml-1 font-mono text-[11px] text-texto-3">escala: {nivel === "dia" ? "dias" : nivel === "semana" ? "semanas" : "meses"}</span>
        {hoje != null && (
          <button type="button" onClick={irHoje} className="ml-2 h-6 border border-linha-forte px-2 hover:bg-acento-suave">
            Hoje
          </button>
        )}
        <span className="ml-auto flex items-center gap-3 text-[11px] text-texto-2">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-4 bg-acento" /> normal
          </span>
          {mostrarCritico && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-4 bg-erro" /> crítica
            </span>
          )}
          {mostrarLinhaBase && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-4 border border-texto-3" /> linha de base
            </span>
          )}
        </span>
      </div>
      <div
        ref={rolagem}
        className="relative overflow-auto"
        style={{ height: altura }}
        onWheel={(e) => {
          if (!e.ctrlKey) return;
          e.preventDefault();
          zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2);
        }}
      >
        <div className="flex" style={{ width: 320 + largura }}>
          {/* coluna fixa */}
          <div className="sticky left-0 z-20 w-[320px] shrink-0 border-r border-linha-forte bg-painel">
            <div className="sticky top-0 z-10 grid h-[42px] grid-cols-[1fr_52px_70px] items-end border-b border-linha-forte bg-painel-2 px-2 pb-1 font-semibold text-texto-2">
              <span>Tarefa</span>
              <span className="text-right">Dur.</span>
              <span className="text-right">Início</span>
            </div>
            {visiveis.map((t) => {
              const g = geo(t);
              return (
                <div
                  key={t.id}
                  onClick={() => onSelecionar?.(t.id)}
                  className={`grid cursor-default grid-cols-[1fr_52px_70px] items-center border-b border-linha px-2 ${selecionada === t.id ? "bg-acento-suave" : "hover:bg-painel-2"} ${t.resumo ? "font-semibold" : ""}`}
                  style={{ height: ALT }}
                >
                  <span className="flex min-w-0 items-center gap-1" style={{ paddingLeft: (t.nivel ?? 0) * 14 }}>
                    {t.resumo ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecolhidos((r) => {
                            const n = new Set(r);
                            if (n.has(t.id)) n.delete(t.id);
                            else n.add(t.id);
                            return n;
                          });
                        }}
                        className="text-texto-3"
                      >
                        <Icone nome="seta" tamanho={11} className={recolhidos.has(t.id) ? "" : "rotate-90"} />
                      </button>
                    ) : (
                      <span className="w-[11px]" />
                    )}
                    <span className={`truncate ${criticas.has(t.id) ? "text-erro" : ""}`}>{t.nome}</span>
                  </span>
                  <span className="text-right font-mono text-[11px]">{t.marco ? "marco" : `${g.dur}d`}</span>
                  <span className="text-right font-mono text-[11px] text-texto-2">{dataDoDia(inicio, g.ini).slice(0, 5)}</span>
                </div>
              );
            })}
          </div>

          {/* área do gráfico */}
          <div className="relative shrink-0" style={{ width: largura }} onPointerMove={moverArrasto} onPointerUp={soltarArrasto}>
            <svg width={largura} height={42 + visiveis.length * ALT} className="block">
              {/* régua */}
              <rect x={0} y={0} width={largura} height={42} fill="var(--cr-painel-2)" />
              {meses.map((m) => (
                <text key={`m${m.dia}`} x={X(m.dia) + 4} y={15} className="fill-texto text-[11px] font-semibold">
                  {m.rotulo}
                </text>
              ))}
              {ticks.map((t) => (
                <g key={t.dia}>
                  <line x1={X(t.dia)} x2={X(t.dia)} y1={nivel === "mes" ? 0 : 22} y2={42 + visiveis.length * ALT} stroke={t.forte ? "var(--cr-linha-forte)" : "var(--cr-linha)"} />
                  {nivel !== "mes" && (
                    <text x={X(t.dia) + 3} y={36} className="fill-texto-3 font-mono text-[10px]">
                      {t.rotulo}
                    </text>
                  )}
                </g>
              ))}
              <line x1={0} x2={largura} y1={42} y2={42} stroke="var(--cr-linha-forte)" />
              {visiveis.map((t, i) => (
                <rect key={`f${t.id}`} x={0} y={42 + i * ALT} width={largura} height={ALT} fill={selecionada === t.id ? "var(--cr-acento-suave)" : "transparent"} opacity={0.6} />
              ))}

              {/* dependências */}
              {visiveis.flatMap((t) =>
                (t.predecessoras ?? [])
                  .filter((p) => linha.has(p))
                  .map((p) => {
                    const pt = visiveis[linha.get(p)!];
                    const gp = geo(pt);
                    const g = geo(t);
                    const x1 = X(gp.ini + gp.dur);
                    const y1 = 42 + linha.get(p)! * ALT + ALT / 2;
                    const x2 = X(g.ini);
                    const y2 = 42 + linha.get(t.id)! * ALT + ALT / 2;
                    const crit = criticas.has(p) && criticas.has(t.id);
                    const xm = Math.max(x1 + 8, Math.min(x2 - 8, x1 + 8));
                    const d = x2 - 8 >= x1 + 8 ? `M${x1} ${y1}H${xm}V${y2}H${x2 - 2}` : `M${x1} ${y1}H${x1 + 8}V${y1 + ALT / 2}H${x2 - 10}V${y2}H${x2 - 2}`;
                    return (
                      <g key={`${p}>${t.id}`}>
                        <path d={d} fill="none" stroke={crit ? "var(--cr-erro)" : "var(--cr-texto-3)"} strokeWidth={1.2} />
                        <path d={`M${x2 - 6} ${y2 - 3.5}L${x2} ${y2}L${x2 - 6} ${y2 + 3.5}Z`} fill={crit ? "var(--cr-erro)" : "var(--cr-texto-3)"} />
                      </g>
                    );
                  }),
              )}

              {/* barras */}
              {visiveis.map((t, i) => {
                const g = geo(t);
                const y = 42 + i * ALT;
                const crit = criticas.has(t.id);
                const cor = crit ? "var(--cr-erro)" : "var(--cr-acento)";
                if (t.marco) {
                  const cx = X(g.ini);
                  return (
                    <g key={t.id} onClick={() => onSelecionar?.(t.id)}>
                      <path d={`M${cx} ${y + 6}L${cx + 7} ${y + 13}L${cx} ${y + 20}L${cx - 7} ${y + 13}Z`} fill={crit ? "var(--cr-erro)" : "var(--cr-texto)"} />
                      <text x={cx + 11} y={y + 17} className="fill-texto-2 font-mono text-[10px]">
                        {dataDoDia(inicio, g.ini).slice(0, 5)}
                      </text>
                    </g>
                  );
                }
                if (t.resumo) {
                  const x0 = X(g.ini);
                  const x1 = X(g.ini + g.dur);
                  return <path key={t.id} d={`M${x0} ${y + 18}V${y + 8}H${x1}V${y + 18}L${x1 - 5} ${y + 13}H${x0 + 5}Z`} fill="var(--cr-texto-2)" />;
                }
                return (
                  <g key={t.id} className={onAlterar ? "cursor-grab" : "cursor-pointer"}>
                    {mostrarLinhaBase && t.linhaBase && (
                      <rect x={X(t.linhaBase.inicio)} y={y + 19} width={t.linhaBase.duracao * pxDia} height={4} fill="none" stroke="var(--cr-texto-3)" />
                    )}
                    <rect
                      x={X(g.ini)}
                      y={y + 6}
                      width={Math.max(g.dur * pxDia, 2)}
                      height={12}
                      rx={2}
                      fill={cor}
                      opacity={selecionada === t.id ? 1 : 0.85}
                      stroke={selecionada === t.id ? "var(--cr-texto)" : "none"}
                      onPointerDown={(e) => iniciarArrasto(e, t, "mover")}
                      onClick={() => onSelecionar?.(t.id)}
                    >
                      <title>{`${t.nome}\n${dataDoDia(inicio, g.ini)} → ${dataDoDia(inicio, g.ini + g.dur)} (${g.dur} d)${t.progresso != null ? ` · ${Math.round(t.progresso * 100)}%` : ""}`}</title>
                    </rect>
                    {t.progresso != null && <rect x={X(g.ini)} y={y + 10} width={g.dur * pxDia * t.progresso} height={4} fill="var(--cr-painel)" opacity={0.75} pointerEvents="none" />}
                    {onAlterar && <rect x={X(g.ini + g.dur) - 4} y={y + 5} width={8} height={14} fill="transparent" className="cursor-ew-resize" onPointerDown={(e) => iniciarArrasto(e, t, "duracao")} />}
                    {arrasto?.id === t.id && (
                      <text x={X(g.ini + g.dur) + 6} y={y + 16} className="fill-texto font-mono text-[10px]">
                        {dataDoDia(inicio, g.ini).slice(0, 5)} · {g.dur}d
                      </text>
                    )}
                  </g>
                );
              })}
              {hoje != null && (
                <g pointerEvents="none">
                  <line x1={X(hoje)} x2={X(hoje)} y1={22} y2={42 + visiveis.length * ALT} stroke="var(--cr-alerta)" strokeWidth={1.5} strokeDasharray="4 3" />
                  <text x={X(hoje) + 3} y={30} className="text-[10px] font-semibold" fill="var(--cr-alerta)">
                    hoje
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
      <div className="border-t border-linha px-2 py-0.5 text-[10px] text-texto-3">
        Arraste a barra para mover · arraste a borda direita para mudar a duração · Ctrl+roda = zoom · clique ▸ para recolher resumos
      </div>
    </div>
  );
}
