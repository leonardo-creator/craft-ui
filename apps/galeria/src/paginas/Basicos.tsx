import { useState } from "react";
import { Alternar, Botao, Campo, Dialogo, GrupoCampos, ICONES, Icone, InputEngenharia, Segmentado, Selecao, TabelaDados, type ColunaTabela, type NomeIcone } from "@craft/ui";
import { Demo, Pagina } from "../Pagina";

export function Tokens() {
  const cores = ["fundo", "painel", "painel-2", "area", "linha", "linha-forte", "texto", "texto-2", "texto-3", "acento", "acento-suave", "sucesso", "alerta", "erro", "contexto", "eixo-x", "eixo-y", "eixo-z"];
  return (
    <Pagina
      titulo="Tokens e ícones"
      resumo="Base 'Technical Engineering Workbench' (frente 04) + tema escuro. Toda cor de componente vem de um token --cr-*; trocar o tema não exige mexer em componente."
      componentes={["Icone"]}
      criterios={["U14"]}
      uso={`/* app.css */\n@import "tailwindcss";\n@import "@craft/ui/styles.css";\n\n<html data-tema="escuro">  // tema escuro\n<div className="bg-painel text-texto border-linha">…`}
    >
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {cores.map((c) => (
          <div key={c} className="border border-linha bg-painel">
            <div className="h-10" style={{ background: `var(--cr-${c})` }} />
            <div className="px-1.5 py-1 font-mono text-[10px]">--cr-{c}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Demo className="p-3">
          <div className="text-[11px] text-texto-3">Interface — Inter 11–15px</div>
          <div className="text-[15px] font-semibold">Pórtico P1 — Pavimento Térreo</div>
          <div className="text-[13px]">Selecione o elemento para editar</div>
          <div className="text-[11px] text-texto-2">Texto auxiliar e rótulos</div>
        </Demo>
        <Demo className="p-3 font-mono">
          <div className="text-[11px] text-texto-3">Números — JetBrains Mono (tabular)</div>
          <div className="text-[15px]">Nsd = 1.234,56 kN</div>
          <div className="text-[13px]">x 12,500 y 3,000 z 6,000</div>
          <div className="text-[11px] text-texto-2">ES 2026-11-12 · EF 2026-12-01</div>
        </Demo>
      </div>
      <h3 className="mt-5 mb-2 text-[13px] font-semibold">Ícones ({Object.keys(ICONES).length}) — um conjunto para as 7 frentes</h3>
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-8 lg:grid-cols-10">
        {(Object.keys(ICONES) as NomeIcone[]).map((n) => (
          <div key={n} className="flex flex-col items-center gap-1 border border-linha bg-painel py-2" title={n}>
            <Icone nome={n} tamanho={20} />
            <span className="font-mono text-[9px] text-texto-3">{n}</span>
          </div>
        ))}
      </div>
    </Pagina>
  );
}

export function Campos() {
  const [vao, setVao] = useState(5);
  const [carga, setCarga] = useState(12.5);
  const [cob, setCob] = useState(0.025);
  const [ult, setUlt] = useState("—");
  const [mod, setMod] = useState<"elu" | "els">("elu");
  const [ativo, setAtivo] = useState(true);
  return (
    <Pagina
      titulo="Campos e número de engenharia"
      resumo="O InputEngenharia é o da BASE COMUM A (01/04/05) — o que já funcionava foi mantido — com sufixo de unidade visível, erro em linha, limites e ↑/↓ para incrementar. Correção: 'mês' não colide mais com 'm' (metro)."
      componentes={["InputEngenharia", "Campo", "Icone"]}
      criterios={["U04", "U11"]}
      uso={`<Campo rotulo="Vão" ajuda="Aceita 5, 5,5, 550cm, 10/2">
  <InputEngenharia valor={vao} unidadeCampo="m" min={0.5} max={30} passo={0.05}
    onChange={(_, r) => setVao(r.valor)} />
</Campo>`}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Demo className="p-3">
          <GrupoCampos titulo="Geometria">
            <Campo rotulo="Vão" ajuda="Teste: 550cm · 10/2 · 1.234,5 · abc · 50">
              <InputEngenharia valor={vao} unidadeCampo="m" min={0.5} max={30} passo={0.05} onChange={(t, r) => (setVao(r.valor), setUlt(`"${t}" → ${r.valor} m`))} />
            </Campo>
            <Campo rotulo="Cobrimento" norma="NBR 6118 Tab.7.2">
              <InputEngenharia valor={cob} unidadeCampo="m" passo={0.005} min={0.015} onChange={(t, r) => (setCob(r.valor), setUlt(`"${t}" → ${r.valor} m`))} />
            </Campo>
          </GrupoCampos>
          <GrupoCampos titulo="Ações">
            <Campo rotulo="Carga distribuída">
              <InputEngenharia valor={carga} sufixo="kN/m" passo={0.5} onChange={(t, r) => (setCarga(r.valor), setUlt(`"${t}" → ${r.valor} kN/m`))} />
            </Campo>
            <Campo rotulo="Estado-limite">
              <Segmentado valor={mod} onChange={setMod} opcoes={[{ valor: "elu", rotulo: "ELU" }, { valor: "els", rotulo: "ELS" }]} />
            </Campo>
            <Campo rotulo="Classe de agressividade">
              <Selecao opcoes={["I", "II", "III", "IV"].map((v) => ({ valor: v, rotulo: `CAA ${v}` }))} defaultValue="II" />
            </Campo>
            <Campo rotulo="Considerar 2ª ordem">
              <Alternar marcado={ativo} onChange={setAtivo} rotulo={ativo ? "Sim" : "Não"} />
            </Campo>
          </GrupoCampos>
        </Demo>
        <div className="space-y-3">
          <Demo className="p-3 font-mono text-[12px]">
            <div className="text-[11px] text-texto-3">Último commit</div>
            <div className="text-acento">{ult}</div>
            <div className="mt-2 text-texto-2">
              vão {vao} m · cobrimento {cob} m · carga {carga} kN/m
            </div>
          </Demo>
          <Demo className="p-3">
            <div className="mb-2 text-[11px] text-texto-3">Botões</div>
            <div className="flex flex-wrap gap-2">
              <Botao variante="primario" icone="calcular">
                Calcular
              </Botao>
              <Botao icone="salvar">Salvar</Botao>
              <Botao variante="fantasma" icone="config">
                Opções
              </Botao>
              <Botao variante="perigo" icone="apagar">
                Apagar
              </Botao>
              <Botao disabled>Desabilitado</Botao>
            </div>
          </Demo>
        </div>
      </div>
    </Pagina>
  );
}

export function DialogoPag() {
  const [aberto, setAberto] = useState<"modal" | "flutuante" | null>(null);
  const [v0, setV0] = useState(45);
  const [s2, setS2] = useState(0.86);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Pagina
      titulo="Diálogo"
      resumo="Substitui os ~129 modais 'fixed inset-0' feitos à mão. Mesmo teclado, mesmo layout de campos, erro sempre no mesmo lugar. Versão não-modal deixa o modelo clicável (ideal para Propriedades, Seções, Vento)."
      componentes={["Dialogo", "Campo", "GrupoCampos"]}
      criterios={["U10", "U04", "U13"]}
      uso={`<Dialogo aberto={aberto} titulo="Vento" subtitulo="NBR 6123:2023"
  onFechar={fechar} onConfirmar={aplicar} erro={erro} modal={false} id="vento">
  <Campo rotulo="V0"><InputEngenharia valor={v0} sufixo="m/s" … /></Campo>
</Dialogo>`}
    >
      <Demo className="flex flex-wrap items-center gap-3 p-4">
        <Botao variante="primario" onClick={() => setAberto("modal")}>
          Abrir modal (Vento)
        </Botao>
        <Botao onClick={() => setAberto("flutuante")}>Abrir flutuante (não bloqueia)</Botao>
        <span className="text-[12px] text-texto-3">Teste: Enter confirma, Esc fecha, Tab circula, arraste pelo título. V0 = 0 dá erro.</span>
      </Demo>
      <Dialogo
        aberto={aberto != null}
        id={aberto === "flutuante" ? "demo-flutuante" : undefined}
        modal={aberto === "modal"}
        titulo="Definir ▸ Vento"
        subtitulo="NBR 6123:2023 — carga lateral automática"
        erro={erro}
        onFechar={() => (setAberto(null), setErro(null))}
        onConfirmar={() => {
          if (v0 <= 0) return setErro("V0 deve ser maior que zero (isopleta da região).");
          setErro(null);
          setAberto(null);
        }}
        rotuloConfirmar="Aplicar"
        rodapeEsquerda={<Botao variante="fantasma">Padrões</Botao>}
      >
        <GrupoCampos titulo="Velocidade">
          <Campo rotulo="V0 — velocidade básica" norma="§5.1">
            <InputEngenharia valor={v0} sufixo="m/s" onChange={(_, r) => setV0(r.valor)} />
          </Campo>
          <Campo rotulo="S1 — topográfico">
            <Selecao opcoes={[{ valor: "1", rotulo: "Terreno plano (1,0)" }, { valor: "2", rotulo: "Vales protegidos (0,9)" }]} />
          </Campo>
          <Campo rotulo="S2 — rugosidade" ajuda="Tabela 3 — categoria e classe">
            <InputEngenharia valor={s2} onChange={(_, r) => setS2(r.valor)} />
          </Campo>
        </GrupoCampos>
        <GrupoCampos titulo="Aplicação">
          <Campo rotulo="Direção">
            <Segmentado valor="x" onChange={() => {}} opcoes={[{ valor: "x", rotulo: "+X" }, { valor: "y", rotulo: "+Y" }, { valor: "ambas", rotulo: "Ambas" }]} />
          </Campo>
        </GrupoCampos>
      </Dialogo>
    </Pagina>
  );
}

interface LinhaRes {
  id: number;
  barra: string;
  L: number;
  N: number;
  M: number;
  V: number;
  util: number;
}
export function TabelaPag() {
  const [linhas, setLinhas] = useState<LinhaRes[]>(() =>
    Array.from({ length: 28 }, (_, i) => ({ id: i + 1, barra: `B${i + 1}`, L: [3, 5, 5.83][i % 3], N: Math.round(Math.sin(i) * 3000) / 10, M: Math.round(Math.cos(i * 1.3) * 900) / 10, V: Math.round(Math.sin(i * 0.7) * 400) / 10, util: Math.round((0.35 + ((i * 37) % 70) / 100) * 100) / 100 })),
  );
  const [sel, setSel] = useState<number | null>(null);
  const colunas: ColunaTabela<LinhaRes>[] = [
    { id: "barra", titulo: "Barra", largura: 70 },
    { id: "L", titulo: "Comprimento", unidade: "m", tipo: "numero", casas: 2, editavel: true, total: true },
    { id: "N", titulo: "N", unidade: "kN", tipo: "numero", casas: 1, editavel: true },
    { id: "M", titulo: "M", unidade: "kN·m", tipo: "numero", casas: 1, editavel: true },
    { id: "V", titulo: "V", unidade: "kN", tipo: "numero", casas: 1 },
    {
      id: "util",
      titulo: "Utilização",
      tipo: "numero",
      render: (l) => (
        <span className="inline-flex w-full items-center gap-1.5">
          <span className="h-1.5 flex-1 bg-linha">
            <span className="block h-full" style={{ width: `${Math.min(l.util, 1) * 100}%`, background: l.util > 1 ? "var(--cr-erro)" : l.util > 0.9 ? "var(--cr-alerta)" : "var(--cr-sucesso)" }} />
          </span>
          <span className="w-10 text-right">{l.util.toFixed(2).replace(".", ",")}</span>
        </span>
      ),
    },
  ];
  return (
    <Pagina
      titulo="Tabela de dados"
      resumo="Base para resultados (06), quantitativos (01/03), FlexTables (05/07) e planilha do Gantt (04). Duplo clique edita com o mesmo InputEngenharia."
      componentes={["TabelaDados"]}
      criterios={["U12", "U04", "U11"]}
      uso={`<TabelaDados colunas={[{ id: "N", titulo: "N", unidade: "kN", tipo: "numero", editavel: true }]}
  linhas={resultados} onEditar={(id, col, v) => …}
  destaque={(l) => l.util > 1 ? "critico" : null} />`}
    >
      <TabelaDados
        colunas={colunas}
        linhas={linhas}
        selecionada={sel}
        onSelecionar={setSel}
        destaque={(l) => (l.util > 1 ? "critico" : null)}
        onEditar={(id, c, v) => setLinhas((ls) => ls.map((l) => (l.id === id ? { ...l, [c]: v } : l)))}
      />
    </Pagina>
  );
}
