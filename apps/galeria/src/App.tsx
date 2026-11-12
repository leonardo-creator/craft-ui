import { useEffect, useState, type ReactNode } from "react";
import { Icone, type NomeIcone } from "@craft/ui";
import { Inicio } from "./paginas/Inicio";
import { Catalogo } from "./paginas/Catalogo";
import { Campos, DialogoPag, TabelaPag, Tokens } from "./paginas/Basicos";
import { AreaPag, ComandosPag, PranchetaPag, RibbonPag, Vista3DPag } from "./paginas/Editores";
import { AppCompleto } from "./paginas/AppCompleto";

const NAV: { grupo: string; itens: [string, string, NomeIcone][] }[] = [
  { grupo: "Visão geral", itens: [["inicio", "Início e critérios", "ajuda"], ["catalogo", "Catálogo das 7 frentes", "tabela"], ["tokens", "Tokens e ícones", "camadas"]] },
  { grupo: "Desenho", itens: [["vista3d", "Vista 3D + barras", "vista3d"], ["prancheta", "Prancheta 2D", "planta"]] },
  { grupo: "Comandos", itens: [["comandos", "Barra de ferramentas", "config"], ["ribbon", "Ribbon", "camadas"]] },
  { grupo: "Estrutura de tela", itens: [["area", "Área de trabalho", "grade"], ["dialogo", "Diálogo", "abrir"]] },
  { grupo: "Dados", itens: [["campos", "Campos e números", "no"], ["tabela", "Tabela de dados", "tabela"]] },
  { grupo: "Exemplo", itens: [["app", "App completo", "vista3d"]] },
];

function lerHash() {
  return location.hash.replace("#/", "") || "inicio";
}

export function App() {
  const [pag, setPag] = useState(lerHash);
  const [tema, setTemaEstado] = useState<"claro" | "escuro">(() => {
    let t: "claro" | "escuro" = "claro";
    try {
      t = (localStorage.getItem("galeria:tema") as "claro" | "escuro") ?? "claro";
    } catch {
      /* ok */
    }
    document.documentElement.dataset.tema = t; // síncrono: os tokens já valem no 1º render
    return t;
  });
  const setTema = (t: "claro" | "escuro") => {
    document.documentElement.dataset.tema = t; // antes do render, para o 3D ler as cores certas
    try {
      localStorage.setItem("galeria:tema", t);
    } catch {
      /* ok */
    }
    setTemaEstado(t);
  };
  useEffect(() => {
    const f = () => setPag(lerHash());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const ir = (p: string) => {
    location.hash = `#/${p}`;
    window.scrollTo(0, 0);
  };

  const paginas: Record<string, ReactNode> = {
    inicio: <Inicio ir={ir} />,
    catalogo: <Catalogo />,
    tokens: <Tokens />,
    vista3d: <Vista3DPag tema={tema} />,
    prancheta: <PranchetaPag />,
    comandos: <ComandosPag />,
    ribbon: <RibbonPag />,
    area: <AreaPag />,
    dialogo: <DialogoPag />,
    campos: <Campos />,
    tabela: <TabelaPag />,
    app: <AppCompleto tema={tema} />,
  };

  return (
    <div className="flex min-h-screen">
      <nav className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-linha bg-painel">
        <div className="border-b border-linha px-3 py-3">
          <div className="text-[14px] font-semibold">@craft/ui</div>
          <div className="text-[11px] text-texto-3">Galeria das 7 frentes REA</div>
        </div>
        <div className="flex-1 overflow-auto py-2">
          {NAV.map((g) => (
            <div key={g.grupo} className="mb-2">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-texto-3">{g.grupo}</div>
              {g.itens.map(([id, rot, ic]) => (
                <a
                  key={id}
                  href={`#/${id}`}
                  aria-current={pag === id ? "page" : undefined}
                  className={`flex items-center gap-2 px-3 py-1.5 text-[12px] ${pag === id ? "bg-acento-suave font-semibold text-acento shadow-[inset_2px_0_0_var(--cr-acento)]" : "text-texto hover:bg-painel-2"}`}
                >
                  <Icone nome={ic} tamanho={15} />
                  {rot}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-linha p-2 text-[11px]">
          <span className="text-texto-3">Tema</span>
          {(["claro", "escuro"] as const).map((t) => (
            <button key={t} onClick={() => setTema(t)} className={`h-6 flex-1 border text-[11px] ${tema === t ? "border-acento bg-acento text-white" : "border-linha-forte"}`}>
              {t}
            </button>
          ))}
        </div>
      </nav>
      <main className="min-w-0 flex-1">{paginas[pag] ?? paginas.inicio}</main>
    </div>
  );
}
