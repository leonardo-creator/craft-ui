import { useState, type ReactNode } from "react";
import { Icone } from "@craft/ui";
import { CRITERIOS } from "./criterios";
import inventario from "./dados/inventario.json";

interface ItemInv {
  f: string;
  n: string;
  l: number;
  c: string;
  r: number;
  s: string[];
}
const INV = inventario as ItemInv[];

/** Moldura padrão de cada página da galeria: título, o que substitui, demo, critérios, uso. */
export function Pagina({
  titulo,
  resumo,
  componentes,
  criterios,
  uso,
  children,
}: {
  titulo: string;
  resumo: ReactNode;
  /** Nomes do @craft/ui demonstrados (para cruzar com o inventário). */
  componentes: string[];
  criterios: string[];
  uso?: string;
  children: ReactNode;
}) {
  const [verLista, setVerLista] = useState(false);
  const substitui = INV.filter((i) => i.s.some((s) => componentes.includes(s)));
  const porFrente = new Map<string, number>();
  substitui.forEach((i) => porFrente.set(i.f, (porFrente.get(i.f) ?? 0) + 1));
  const crit = CRITERIOS.filter((c) => criterios.includes(c.id));
  return (
    <article className="mx-auto max-w-[1180px] px-6 py-5">
      <h1 className="text-[20px] font-semibold">{titulo}</h1>
      <p className="mt-1 max-w-3xl text-[13px] text-texto-2">{resumo}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-texto-3">Serve de base para {substitui.length} componentes atuais:</span>
        {[...porFrente].map(([f, n]) => (
          <span key={f} className="border border-linha bg-painel px-1.5 py-0.5 font-mono">
            {f} · {n}
          </span>
        ))}
        {substitui.length > 0 && (
          <button className="text-acento underline" onClick={() => setVerLista((v) => !v)}>
            {verLista ? "ocultar" : "ver quais"}
          </button>
        )}
      </div>
      {verLista && (
        <div className="mt-2 max-h-40 overflow-auto border border-linha bg-painel p-2 font-mono text-[11px] text-texto-2">
          {substitui.map((i) => `${i.f.slice(0, 2)}/${i.n}`).join(" · ")}
        </div>
      )}
      <section className="mt-4">{children}</section>
      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-2 text-[13px] font-semibold">Critérios atendidos</h2>
          <ul className="space-y-1.5">
            {crit.map((c) => (
              <li key={c.id} className="border border-linha bg-painel p-2">
                <div className="flex items-center gap-2 text-[12px] font-semibold">
                  <Icone nome="ok" tamanho={14} className="text-sucesso" />
                  <span className="font-mono text-texto-3">{c.id}</span> {c.titulo}
                </div>
                <p className="mt-0.5 text-[12px] text-texto-2">{c.regra}</p>
                <p className="mt-0.5 text-[11px] text-texto-3">
                  <b>Testar:</b> {c.verificar}
                </p>
              </li>
            ))}
          </ul>
        </div>
        {uso && (
          <div>
            <h2 className="mb-2 text-[13px] font-semibold">Uso</h2>
            <pre className="overflow-auto border border-linha bg-painel p-3 font-mono text-[11.5px] leading-relaxed text-texto">{uso.trim()}</pre>
          </div>
        )}
      </section>
    </article>
  );
}

export function Demo({ children, altura, className = "" }: { children: ReactNode; altura?: number; className?: string }) {
  return (
    <div className={`border border-linha-forte bg-painel ${className}`} style={altura ? { height: altura } : undefined}>
      {children}
    </div>
  );
}

export function useLog() {
  const [itens, setItens] = useState<string[]>([]);
  const log = (t: string) => setItens((x) => [`${new Date().toLocaleTimeString("pt-BR")}  ${t}`, ...x].slice(0, 6));
  const painel = (
    <div className="mt-2 border border-linha bg-painel-2 px-2 py-1 font-mono text-[11px] text-texto-2">
      {itens.length ? itens.map((t, i) => <div key={i}>{t}</div>) : <span className="text-texto-3">Execute um comando (clique, atalho ou Ctrl+K)…</span>}
    </div>
  );
  return { log, painel };
}
