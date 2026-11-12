import { Icone } from "@craft/ui";
import { CRITERIOS } from "../criterios";
import inventario from "../dados/inventario.json";

const INV = inventario as { f: string; c: string; l: number; r: number; s: string[] }[];

export function Inicio({ ir }: { ir: (p: string) => void }) {
  const frentes = [...new Set(INV.map((i) => i.f))];
  const cobertos = INV.filter((i) => i.s.length).length;
  return (
    <article className="mx-auto max-w-[1180px] px-6 py-6">
      <h1 className="text-[24px] font-semibold">Galeria @craft/ui</h1>
      <p className="mt-1 max-w-3xl text-[14px] text-texto-2">
        Biblioteca única de componentes das 7 frentes REA. Aqui ficam as versões melhoradas das peças que hoje estão copiadas e divergentes em cada app, com os
        critérios de usabilidade que todas devem cumprir. As frentes migram depois, uma por vez, trocando as cópias locais por imports do <code>@craft/ui</code>.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Componentes mapeados", INV.length.toLocaleString("pt-BR"), "em 7 frentes"],
          ["Linhas de UI hoje", INV.reduce((s, i) => s + i.l, 0).toLocaleString("pt-BR"), ".tsx somados"],
          ["Com peça-base definida", `${cobertos}`, `${Math.round((cobertos / INV.length) * 100)}% do total`],
          ["Critérios de UX", `${CRITERIOS.length}`, "testáveis"],
        ].map(([t, v, s]) => (
          <div key={t} className="border border-linha bg-painel p-3">
            <div className="text-[11px] text-texto-3">{t}</div>
            <div className="font-mono text-[22px] font-semibold">{v}</div>
            <div className="text-[11px] text-texto-2">{s}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-7 text-[15px] font-semibold">O problema que isto resolve</h2>
      <div className="mt-2 grid gap-3 md:grid-cols-3">
        {[
          ["Cópias divergentes", "Ribbon.tsx existe em 6 frentes (252 a 1.815 linhas), Docks.tsx em 5, Visao3D.tsx em 5, ícones em 6. Melhorar um não melhora os outros."],
          ["Barra engessada", "Cada Ribbon recebe um callback por botão (a da 04 tem 50+ props onXxx). Mudar a barra = mudar código; o usuário não pode ajustar nada."],
          ["Grade e desenho fracos", "Grades 3D com GridHelper fixo (20 ou 30 divisões), sem passo adaptativo, sem guias, sem plano de trabalho — barra em Z/inclinada não sai."],
        ].map(([t, d]) => (
          <div key={t} className="border-l-2 border-erro bg-painel p-3">
            <div className="text-[13px] font-semibold">{t}</div>
            <p className="mt-1 text-[12px] text-texto-2">{d}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-7 text-[15px] font-semibold">Componentes</h2>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["vista3d", "Vista 3D + desenho de barras", "Plano de trabalho, guias por nó, barra em qualquer orientação.", "vista3d"],
          ["planta", "Prancheta 2D", "Grade adaptativa, guias, encaixe, coordenada digitada.", "prancheta"],
          ["config", "Barra de ferramentas", "Encaixa, personaliza, contextual, transbordo, Ctrl+K.", "comandos"],
          ["camadas", "Ribbon", "Guias como dado, guia contextual, minimizar.", "ribbon"],
          ["tabela", "Área de trabalho", "Docks com abas, redimensionar, recolher, status.", "area"],
          ["no", "Campos e número de engenharia", "Vírgula, unidade, fração, Enter/Tab/Esc.", "campos"],
          ["abrir", "Diálogo", "Enter/Esc, foco, erro fixo, não-modal.", "dialogo"],
          ["grafico", "Tabela de dados", "Fixos, unidade no cabeçalho, edição na célula.", "tabela"],
          ["vista3d", "App completo", "Tudo junto num app de exemplo.", "app"],
        ].map(([ic, t, d, p]) => (
          <button key={p} onClick={() => ir(p)} className="flex items-start gap-3 border border-linha bg-painel p-3 text-left hover:border-acento-borda hover:bg-acento-suave">
            <Icone nome={ic as "no"} tamanho={22} className="mt-0.5 text-acento" />
            <span>
              <span className="block text-[13px] font-semibold">{t}</span>
              <span className="block text-[12px] text-texto-2">{d}</span>
            </span>
          </button>
        ))}
      </div>

      <h2 className="mt-7 text-[15px] font-semibold">Critérios de UI/UX ({CRITERIOS.length})</h2>
      <div className="mt-2 overflow-hidden border border-linha bg-painel">
        <table className="w-full text-[12px]">
          <tbody>
            {CRITERIOS.map((c) => (
              <tr key={c.id} className="border-b border-linha align-top last:border-0">
                <td className="w-12 px-2 py-1.5 font-mono text-texto-3">{c.id}</td>
                <td className="w-44 px-2 py-1.5 font-semibold">{c.titulo}</td>
                <td className="px-2 py-1.5 text-texto-2">{c.regra}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-7 text-[15px] font-semibold">Como uma frente vai usar (na migração)</h2>
      <pre className="mt-2 overflow-auto border border-linha bg-painel p-3 font-mono text-[11.5px]">{`git submodule add https://github.com/leonardo-creator/craft-ui vendor/craft-ui   # repo privado: VPS precisa de token/deploy key
npm i ./vendor/craft-ui/packages/ui          # (ou pnpm: "@craft/ui": "github:leonardo-creator/craft-ui#path:packages/ui")

/* app.css */
@import "tailwindcss";
@import "@craft/ui/styles.css";

import { ProvedorComandos, BarraFerramentas, useBarraFerramentas, Dialogo, InputEngenharia } from "@craft/ui";
import { Viewport3D } from "@craft/ui/viewport";   // só quem usa 3D

Frentes: ${frentes.join(" · ")}  — a 08 precisa subir para React 19 / Tailwind 4 antes.`}</pre>
    </article>
  );
}
