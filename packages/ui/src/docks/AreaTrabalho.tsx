/**
 * Área de trabalho = casca comum das 7 frentes (antes: `Docks.tsx` copiado
 * e divergente — 344 a 1934 linhas). Resolve o "tudo amontoado":
 *  - docks esquerda/direita/baixo com LARGURA ARRASTÁVEL e lembrada;
 *  - cada dock recolhe para uma faixa fina (o desenho ganha a tela);
 *  - vários painéis no mesmo dock viram ABAS, não pilha espremida;
 *  - a barra de ferramentas encaixa em topo/esquerda/direita/flutuante;
 *  - a área central é o "data-craft-area" onde a barra flutuante vive.
 */
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Icone, type NomeIcone } from "../base/icones";
import { gravarArmazenado, lerArmazenado } from "../comandos/registro";
import type { PosicaoBarra } from "../comandos/BarraFerramentas";

export interface PainelDock {
  id: string;
  titulo: string;
  icone?: NomeIcone;
  conteudo: ReactNode;
}

type Lado = "esquerda" | "direita" | "baixo";

interface PrefsArea {
  tamanhos: Record<Lado, number>;
  recolhidos: Record<Lado, boolean>;
  abas: Partial<Record<Lado, string>>;
}

export function AreaTrabalho({
  id,
  ribbon,
  barra,
  posicaoBarra = "topo",
  esquerda = [],
  direita = [],
  baixo = [],
  status,
  children,
}: {
  id: string;
  /** Ribbon (opcional) — sempre no topo. */
  ribbon?: ReactNode;
  /** Barra de ferramentas (BarraFerramentas) e onde ela está encaixada. */
  barra?: ReactNode;
  posicaoBarra?: PosicaoBarra;
  esquerda?: PainelDock[];
  direita?: PainelDock[];
  baixo?: PainelDock[];
  status?: ReactNode;
  /** O desenho (Prancheta2D, Viewport3D, Gantt...). */
  children: ReactNode;
}) {
  const chave = `craft-ui:area:${id}`;
  const [p, setP] = useState<PrefsArea>(() =>
    lerArmazenado(chave, { tamanhos: { esquerda: 240, direita: 300, baixo: 200 }, recolhidos: { esquerda: false, direita: false, baixo: true }, abas: {} }),
  );
  const atualizar = useCallback(
    (f: (a: PrefsArea) => PrefsArea) =>
      setP((a) => {
        const n = f(a);
        gravarArmazenado(chave, n);
        return n;
      }),
    [chave],
  );

  const dock = (lado: Lado, paineis: PainelDock[]) =>
    paineis.length ? (
      <Dock
        lado={lado}
        paineis={paineis}
        tamanho={p.tamanhos[lado]}
        recolhido={p.recolhidos[lado]}
        aba={p.abas[lado] ?? paineis[0].id}
        onAba={(a) => atualizar((x) => ({ ...x, abas: { ...x.abas, [lado]: a }, recolhidos: { ...x.recolhidos, [lado]: false } }))}
        onRecolher={(r) => atualizar((x) => ({ ...x, recolhidos: { ...x.recolhidos, [lado]: r } }))}
        onTamanho={(t) => atualizar((x) => ({ ...x, tamanhos: { ...x.tamanhos, [lado]: t } }))}
      />
    ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-fundo text-texto">
      {ribbon}
      {posicaoBarra === "topo" && barra}
      <div className="flex min-h-0 flex-1">
        {posicaoBarra === "esquerda" && barra}
        {dock("esquerda", esquerda)}
        <div className="flex min-w-0 flex-1 flex-col">
          <div data-craft-area="" className="relative min-h-0 flex-1 overflow-hidden bg-area">
            {children}
            {posicaoBarra === "flutuante" && barra}
          </div>
          {dock("baixo", baixo)}
        </div>
        {dock("direita", direita)}
        {posicaoBarra === "direita" && barra}
      </div>
      {status}
    </div>
  );
}

function Dock({
  lado,
  paineis,
  tamanho,
  recolhido,
  aba,
  onAba,
  onRecolher,
  onTamanho,
}: {
  lado: Lado;
  paineis: PainelDock[];
  tamanho: number;
  recolhido: boolean;
  aba: string;
  onAba: (id: string) => void;
  onRecolher: (r: boolean) => void;
  onTamanho: (t: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const horizontal = lado === "baixo";
  const atual = paineis.find((x) => x.id === aba) ?? paineis[0];

  function redimensionar(e: React.PointerEvent) {
    e.preventDefault();
    const inicio = horizontal ? e.clientY : e.clientX;
    const t0 = tamanho;
    const mover = (ev: PointerEvent) => {
      const d = (horizontal ? ev.clientY : ev.clientX) - inicio;
      const sinal = lado === "esquerda" ? 1 : -1;
      onTamanho(Math.max(160, Math.min(720, t0 + sinal * d)));
    };
    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  if (recolhido) {
    return (
      <div className={`flex shrink-0 border-linha bg-painel-2 ${horizontal ? "h-7 items-center gap-1 border-t px-2" : `w-7 flex-col items-center gap-1 py-2 ${lado === "esquerda" ? "border-r" : "border-l"}`}`}>
        {paineis.map((x) => (
          <button
            key={x.id}
            type="button"
            title={`Abrir ${x.titulo}`}
            onClick={() => onAba(x.id)}
            className={`flex items-center gap-1 text-[11px] text-texto-2 hover:text-acento ${horizontal ? "px-1" : "py-1 [writing-mode:vertical-rl]"}`}
          >
            {x.icone && <Icone nome={x.icone} tamanho={14} />}
            {x.titulo}
          </button>
        ))}
      </div>
    );
  }

  const alca = (
    <div
      role="separator"
      aria-orientation={horizontal ? "horizontal" : "vertical"}
      title="Arraste para redimensionar"
      onPointerDown={redimensionar}
      onDoubleClick={() => onTamanho(horizontal ? 200 : 260)}
      className={`shrink-0 bg-linha hover:bg-acento ${horizontal ? "h-1 cursor-row-resize" : "w-1 cursor-col-resize"}`}
    />
  );

  return (
    <div className={`flex shrink-0 ${horizontal ? "flex-col" : ""}`} style={horizontal ? { height: tamanho } : { width: tamanho }}>
      {lado !== "esquerda" && alca}
      <div ref={ref} className="flex min-h-0 min-w-0 flex-1 flex-col bg-painel">
        <div className="flex h-7 shrink-0 items-stretch border-b border-linha bg-painel-2">
          <div role="tablist" className="flex min-w-0 flex-1 overflow-x-auto">
            {paineis.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={x.id === atual.id}
                onClick={() => onAba(x.id)}
                className={`flex shrink-0 items-center gap-1 border-r border-linha px-2 text-[11px] ${
                  x.id === atual.id ? "bg-painel font-semibold text-texto shadow-[inset_0_2px_0_var(--cr-acento)]" : "text-texto-2 hover:text-texto"
                }`}
              >
                {x.icone && <Icone nome={x.icone} tamanho={13} />}
                {x.titulo}
              </button>
            ))}
          </div>
          <button type="button" title="Recolher" onClick={() => onRecolher(true)} className="flex w-7 items-center justify-center text-texto-3 hover:text-texto">
            <Icone nome={horizontal ? "setaBaixo" : "seta"} tamanho={14} className={lado === "esquerda" ? "rotate-180" : ""} />
          </button>
        </div>
        <div role="tabpanel" className="min-h-0 flex-1 overflow-auto">
          {atual.conteudo}
        </div>
      </div>
      {lado === "esquerda" && alca}
    </div>
  );
}

/** Barra de status: coordenadas, unidades, modos (SNAP/GRADE/ORTO) clicáveis. */
export function BarraStatus({ itens, modos = [] }: { itens: ReactNode[]; modos?: { rotulo: string; ativo: boolean; alternar: () => void; titulo?: string }[] }) {
  return (
    <div className="flex h-6 shrink-0 items-center gap-3 border-t border-linha bg-painel px-2 font-mono text-[11px] text-texto-2">
      {itens.map((x, i) => (
        <span key={i} className="whitespace-nowrap">
          {x}
        </span>
      ))}
      <span className="flex-1" />
      {modos.map((m) => (
        <button
          key={m.rotulo}
          type="button"
          title={m.titulo}
          aria-pressed={m.ativo}
          onClick={m.alternar}
          className={`px-1.5 text-[10px] font-semibold tracking-wide ${m.ativo ? "bg-acento-suave text-acento" : "text-texto-3 hover:text-texto"}`}
        >
          {m.rotulo}
        </button>
      ))}
    </div>
  );
}
