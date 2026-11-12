/**
 * Paleta de comandos (Ctrl+K). Acha qualquer comando pelo nome, sem acento,
 * mostra o atalho e põe os recentes primeiro. Resolve o "não acho o botão"
 * sem poluir a barra.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Icone } from "../base/icones";
import { useComandos } from "./registro";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function PaletaComandos() {
  const { comandos, executar, paletaAberta, abrirPaleta, recentes } = useComandos();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const lista = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (paletaAberta) {
      setQ("");
      setI(0);
    }
  }, [paletaAberta]);

  const itens = useMemo(() => {
    const t = norm(q.trim());
    const todos = [...comandos.values()].filter((c) => c.habilitado !== false);
    if (!t) {
      const rec = recentes.map((id) => comandos.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
      return [...rec, ...todos.filter((c) => !recentes.includes(c.id))];
    }
    return todos
      .map((c) => {
        const r = norm(c.rotulo);
        const pont = r.startsWith(t) ? 0 : r.includes(t) ? 1 : norm(`${c.categoria ?? ""} ${c.descricao ?? ""}`).includes(t) ? 2 : 9;
        return { c, pont };
      })
      .filter((x) => x.pont < 9)
      .sort((a, b) => a.pont - b.pont)
      .map((x) => x.c);
  }, [q, comandos, recentes]);

  useEffect(() => {
    lista.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" });
  }, [i]);

  if (!paletaAberta) return null;
  const rodar = (id?: string) => {
    abrirPaleta(false);
    if (id) executar(id);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/30 pt-[12vh]" onMouseDown={() => abrirPaleta(false)}>
      <div className="w-[min(560px,92vw)] border border-linha bg-painel shadow-flutuante" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-linha px-3">
          <Icone nome="buscar" className="text-texto-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setI((x) => Math.min(x + 1, itens.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setI((x) => Math.max(x - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                rodar(itens[i]?.id);
              } else if (e.key === "Escape") {
                e.preventDefault();
                abrirPaleta(false);
              }
            }}
            placeholder="Digite um comando… (pilar, viga, copiar, calcular)"
            className="h-11 flex-1 bg-transparent text-[14px] outline-none"
          />
        </div>
        <ul ref={lista} role="listbox" className="max-h-[50vh] overflow-auto p-1">
          {itens.length === 0 && <li className="px-3 py-4 text-center text-[12px] text-texto-3">Nenhum comando com “{q}”.</li>}
          {itens.map((c, n) => (
            <li
              key={c.id}
              data-i={n}
              role="option"
              aria-selected={n === i}
              onMouseEnter={() => setI(n)}
              onClick={() => rodar(c.id)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-1.5 text-[13px] ${n === i ? "bg-acento-suave" : ""}`}
            >
              {c.icone ? <Icone nome={c.icone} tamanho={16} /> : <span className="w-4" />}
              <span>{c.rotulo}</span>
              {!q && n < recentes.length && <span className="text-[10px] text-texto-3">recente</span>}
              {c.categoria && <span className="text-[11px] text-texto-3">{c.categoria}</span>}
              {c.atalho && <kbd className="ml-auto">{c.atalho}</kbd>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Menu de contexto (botão direito) a partir de ids do registro. */
export function MenuContexto({
  x,
  y,
  ids,
  onFechar,
}: {
  x: number;
  y: number;
  ids: string[];
  onFechar: () => void;
}) {
  const { comandos, executar } = useComandos();
  useEffect(() => {
    const f = () => onFechar();
    window.addEventListener("pointerdown", f);
    window.addEventListener("keydown", f);
    return () => {
      window.removeEventListener("pointerdown", f);
      window.removeEventListener("keydown", f);
    };
  }, [onFechar]);
  return (
    <div
      role="menu"
      className="fixed z-[90] min-w-48 border border-linha bg-painel p-1 shadow-flutuante"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {ids.map((id, n) => {
        if (id === "-") return <div key={`sep${n}`} className="my-1 border-t border-linha" />;
        const c = comandos.get(id);
        if (!c) return null;
        return (
          <button
            key={id}
            role="menuitem"
            disabled={c.habilitado === false}
            onClick={() => {
              executar(id);
              onFechar();
            }}
            className="flex w-full items-center gap-2 px-2 py-1 text-left text-[12px] hover:bg-acento-suave disabled:opacity-40"
          >
            {c.icone ? <Icone nome={c.icone} tamanho={15} /> : <span className="w-[15px]" />}
            {c.rotulo}
            {c.atalho && <span className="ml-auto pl-4 font-mono text-[10px] text-texto-3">{c.atalho}</span>}
          </button>
        );
      })}
    </div>
  );
}
