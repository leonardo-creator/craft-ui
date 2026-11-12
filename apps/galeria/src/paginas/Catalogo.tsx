import { useMemo, useState } from "react";
import inventario from "../dados/inventario.json";

interface ItemInv {
  f: string;
  n: string;
  l: number;
  c: string;
  r: number;
  m: boolean;
  s: string[];
}
const INV = inventario as ItemInv[];

/** Catálogo dos 450 componentes atuais → qual peça do @craft/ui assume cada um. É o mapa da migração. */
export function Catalogo() {
  const [frente, setFrente] = useState("");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [soRepetidos, setSoRepetidos] = useState(false);
  const frentes = [...new Set(INV.map((i) => i.f))];
  const cats = [...new Set(INV.map((i) => i.c))];
  const lista = useMemo(
    () =>
      INV.filter(
        (i) => (!frente || i.f === frente) && (!cat || i.c === cat) && (!soRepetidos || i.r > 1) && (!q || i.n.toLowerCase().includes(q.toLowerCase())),
      ),
    [frente, cat, q, soRepetidos],
  );
  const matriz = cats.map((c) => ({ c, por: frentes.map((f) => INV.filter((i) => i.c === c && i.f === f).length) }));

  return (
    <article className="mx-auto max-w-[1180px] px-6 py-5">
      <h1 className="text-[20px] font-semibold">Catálogo das 7 frentes</h1>
      <p className="mt-1 max-w-3xl text-[13px] text-texto-2">
        Todos os {INV.length} componentes .tsx das frentes, agrupados por tipo, com a peça do @craft/ui que passa a ser a base de cada um. Telas de domínio (ex.:
        Sapatas, Vento, Sprinklers) continuam na frente, mas montadas com Diálogo + Campo + Propriedades em vez de HTML solto.
      </p>

      <div className="mt-4 overflow-auto border border-linha bg-painel">
        <table className="w-full text-[12px]">
          <thead className="bg-painel-2">
            <tr>
              <th className="px-2 py-1 text-left font-semibold">Tipo</th>
              {frentes.map((f) => (
                <th key={f} className="px-2 py-1 text-right font-mono text-[11px] font-semibold">
                  {f.split(" ")[0]}
                </th>
              ))}
              <th className="px-2 py-1 text-left font-semibold">Base no @craft/ui</th>
            </tr>
          </thead>
          <tbody>
            {matriz.map(({ c, por }) => (
              <tr key={c} className="cursor-pointer border-t border-linha hover:bg-acento-suave" onClick={() => setCat(cat === c ? "" : c)}>
                <td className={`px-2 py-1 ${cat === c ? "font-semibold text-acento" : ""}`}>{c}</td>
                {por.map((n, i) => (
                  <td key={i} className="px-2 py-1 text-right font-mono" style={{ background: n ? `color-mix(in srgb, var(--cr-acento) ${Math.min(8 + n * 2, 45)}%, transparent)` : undefined }}>
                    {n || ""}
                  </td>
                ))}
                <td className="px-2 py-1 font-mono text-[11px] text-texto-2">{[...new Set(INV.filter((i) => i.c === c).flatMap((i) => i.s))].join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar componente…" className="h-7 w-56 border border-linha-forte bg-painel px-2 text-[12px] outline-none focus:border-acento" />
        <select value={frente} onChange={(e) => setFrente(e.target.value)} className="h-7 border border-linha-forte bg-painel px-1 text-[12px]">
          <option value="">Todas as frentes</option>
          {frentes.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-7 border border-linha-forte bg-painel px-1 text-[12px]">
          <option value="">Todos os tipos</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-[12px]">
          <input type="checkbox" checked={soRepetidos} onChange={(e) => setSoRepetidos(e.target.checked)} /> só repetidos entre frentes
        </label>
        <span className="ml-auto font-mono text-[11px] text-texto-3">
          {lista.length} itens · {lista.reduce((s, i) => s + i.l, 0).toLocaleString("pt-BR")} linhas
        </span>
      </div>

      <div className="mt-2 max-h-[560px] overflow-auto border border-linha bg-painel">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-painel-2">
            <tr>
              <th className="px-2 py-1 text-left">Frente</th>
              <th className="px-2 py-1 text-left">Componente</th>
              <th className="px-2 py-1 text-left">Tipo</th>
              <th className="px-2 py-1 text-right">Linhas</th>
              <th className="px-2 py-1 text-right">Cópias</th>
              <th className="px-2 py-1 text-left">Base no @craft/ui</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((i) => (
              <tr key={i.f + i.n} className="border-t border-linha hover:bg-painel-2">
                <td className="px-2 py-0.5 font-mono text-[11px] text-texto-2">{i.f}</td>
                <td className="px-2 py-0.5 font-medium">{i.n}</td>
                <td className="px-2 py-0.5 text-texto-2">{i.c}</td>
                <td className="px-2 py-0.5 text-right font-mono">{i.l.toLocaleString("pt-BR")}</td>
                <td className={`px-2 py-0.5 text-right font-mono ${i.r > 1 ? "font-semibold text-erro" : "text-texto-3"}`}>{i.r > 1 ? `${i.r}×` : "—"}</td>
                <td className="px-2 py-0.5 font-mono text-[11px] text-acento">{i.s.join(" + ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
