import { lazy, Suspense, useMemo, useState } from "react";
import {
  AreaTrabalho,
  Arvore,
  BarraFerramentas,
  BarraStatus,
  GradePropriedades,
  MenuContexto,
  PaletaComandos,
  Prancheta2D,
  ProvedorComandos,
  Ribbon,
  Segmentado,
  useBarraFerramentas,
  PORTICO_EXEMPLO,
  type Encaixe,
  type ModeloBarras,
  type NoArvore,
  type Vec3,
  type Eixo,
} from "@craft/ui";
import { comandosDemo, GRUPOS_PADRAO, GUIAS_CONTEXTO, GUIAS_DEMO } from "../comandosDemo";
import { Demo, Pagina, useLog } from "../Pagina";

const Viewport3D = lazy(() => import("@craft/ui/viewport").then((m) => ({ default: m.Viewport3D })));

const fmt = (v: number) => v.toFixed(2).replace(".", ",");
type InfoCursor = { ponto: Vec3; delta: Vec3 | null; tipo: Encaixe["tipo"]; passo: number } | null;

export function ComandosPag() {
  const { log, painel } = useLog();
  const [contexto, setContexto] = useState<string | null>(null);
  const [personalizando, setPersonalizando] = useState(false);
  const comandos = useMemo(() => comandosDemo(log), []); // eslint-disable-line react-hooks/exhaustive-deps
  const barra = useBarraFerramentas("galeria-demo", GRUPOS_PADRAO);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <Pagina
      titulo="Barra de ferramentas + paleta Ctrl+K"
      resumo="Um componente, seis comportamentos: posição (arraste a alça ⋮⋮), densidade, personalizar (⚙), contextual (selecione no desenho), transbordo para 'Mais' (estreite a janela) e memória. Tudo dirigido pelo registro de comandos — atalhos de teclado funcionam (B, P, V, Ctrl+Z…)."
      componentes={["BarraFerramentas", "PaletaComandos"]}
      criterios={["U01", "U02", "U03", "U09", "U13"]}
      uso={`const comandos: Comando[] = [
  { id: "pilar", rotulo: "Pilar", icone: "pilar", atalho: "P", categoria: "Desenhar", executar: () => setFerramenta("pilar") },
  { id: "secao", rotulo: "Seção", icone: "secao", contexto: ["barra"], executar: abrirSecao },
];
const barra = useBarraFerramentas("eberick", [["selecionar"], ["pilar", "viga", "laje"]]);

<ProvedorComandos comandos={comandos}>
  <AreaTrabalho id="eberick" barra={<BarraFerramentas estado={barra} contexto={tipoSelecao}
      personalizando={p} onPersonalizando={setP} />} posicaoBarra={barra.posicao}>…</AreaTrabalho>
  <PaletaComandos />
</ProvedorComandos>`}
    >
      <ProvedorComandos comandos={comandos}>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[12px]">
          <span className="text-texto-3">Posição</span>
          <Segmentado valor={barra.posicao} onChange={(posicao) => barra.definir({ posicao })} opcoes={[{ valor: "topo", rotulo: "Topo" }, { valor: "esquerda", rotulo: "Esquerda" }, { valor: "direita", rotulo: "Direita" }, { valor: "flutuante", rotulo: "Flutuante" }]} />
          <span className="text-texto-3">Densidade</span>
          <Segmentado valor={barra.densidade} onChange={(densidade) => barra.definir({ densidade })} opcoes={[{ valor: "rotulo", rotulo: "Ícone + texto" }, { valor: "icone", rotulo: "Só ícone" }]} />
          <button className="h-7 border border-linha-forte bg-painel px-2 hover:bg-acento-suave" onClick={() => setPersonalizando(true)}>
            Personalizar
          </button>
          <button className="h-7 border border-linha-forte bg-painel px-2 hover:bg-acento-suave" onClick={barra.restaurar}>
            Restaurar padrão
          </button>
        </div>
        <Demo altura={420}>
          <AreaTrabalho
            id="galeria-cmd"
            posicaoBarra={barra.posicao}
            barra={<BarraFerramentas estado={barra} contexto={contexto} personalizando={personalizando} onPersonalizando={setPersonalizando} />}
          >
            <svg
              className="h-full w-full"
              onClick={(e) => {
                const t = (e.target as Element).getAttribute("data-tipo");
                setContexto(t);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if ((e.target as Element).getAttribute("data-tipo")) setMenu({ x: e.clientX, y: e.clientY });
              }}
            >
              <defs>
                <pattern id="gp" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M24 0H0V24" fill="none" stroke="var(--cr-linha)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gp)" />
              {[
                [140, 300, 140, 140],
                [380, 300, 380, 140],
                [140, 140, 380, 140],
                [140, 300, 380, 140],
              ].map(([x1, y1, x2, y2], i) => (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} data-tipo="barra" className="cursor-pointer" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={contexto === "barra" ? "var(--cr-contexto)" : "var(--cr-texto-2)"} strokeWidth={4} pointerEvents="none" />
                </g>
              ))}
              {[
                [140, 300],
                [380, 300],
                [140, 140],
                [380, 140],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={7} fill={contexto === "no" ? "var(--cr-contexto)" : "var(--cr-texto)"} data-tipo="no" className="cursor-pointer" />
              ))}
              <text x={420} y={160} className="fill-texto-3 text-[12px]">
                Clique numa barra ou nó → comandos contextuais (roxo)
              </text>
              <text x={420} y={180} className="fill-texto-3 text-[12px]">
                Botão direito → menu de contexto · Ctrl+K → paleta
              </text>
            </svg>
          </AreaTrabalho>
        </Demo>
        {menu && <MenuContexto x={menu.x} y={menu.y} onFechar={() => setMenu(null)} ids={contexto === "no" ? ["apoio", "travarNo", "carga", "-", "copiar", "apagar"] : ["secao", "carga", "girarEixo", "dividir", "-", "copiar", "mover", "apagar"]} />}
        {painel}
        <PaletaComandos />
      </ProvedorComandos>
    </Pagina>
  );
}

export function RibbonPag() {
  const { log, painel } = useLog();
  const [contexto, setContexto] = useState<string | null>(null);
  const comandos = useMemo(() => comandosDemo(log), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Pagina
      titulo="Ribbon"
      resumo="Para quem gosta do estilo AltoQi/CSI/Project. Guias são dado; a guia CONTEXTUAL aparece em roxo ao selecionar; grupos que não cabem viram botão-menu; duplo clique na guia (ou Ctrl+F1) minimiza; a guia aberta é lembrada. Mesmo registro da barra — o app pode oferecer os dois."
      componentes={["Ribbon"]}
      criterios={["U01", "U02", "U03", "U09", "U13"]}
      uso={`<Ribbon id="mefcraft" guias={GUIAS} guiasContextuais={{ barra: GUIA_BARRA }} contexto={tipoSelecao} />`}
    >
      <ProvedorComandos comandos={comandos}>
        <div className="mb-2 flex items-center gap-3 text-[12px]">
          <span className="text-texto-3">Simular seleção:</span>
          <Segmentado valor={contexto ?? "nada"} onChange={(v) => setContexto(v === "nada" ? null : v)} opcoes={[{ valor: "nada", rotulo: "Nada" }, { valor: "barra", rotulo: "Barra" }, { valor: "no", rotulo: "Nó" }]} />
        </div>
        <Demo>
          <Ribbon id="galeria-ribbon" guias={GUIAS_DEMO} guiasContextuais={GUIAS_CONTEXTO} contexto={contexto} />
          <div className="h-40 bg-area" />
        </Demo>
        {painel}
        <PaletaComandos />
      </ProvedorComandos>
    </Pagina>
  );
}

const ARVORE: NoArvore[] = [
  {
    id: "proj",
    rotulo: "Edifício Exemplo",
    icone: "camadas",
    filhos: [
      { id: "cob", rotulo: "Cobertura", icone: "laje", info: "z 9,00", visivel: true, filhos: [{ id: "v1", rotulo: "V1 20×50", icone: "viga" }, { id: "v2", rotulo: "V2 20×50", icone: "viga" }] },
      { id: "p2", rotulo: "Pavimento 2", icone: "laje", info: "z 6,00", visivel: true, filhos: [{ id: "p1a", rotulo: "P1 20×40", icone: "pilar" }, { id: "p2a", rotulo: "P2 20×40", icone: "pilar" }] },
      { id: "p1", rotulo: "Pavimento 1", icone: "laje", info: "z 3,00", visivel: true },
      { id: "fund", rotulo: "Fundação", icone: "apoio", info: "z 0,00", visivel: false },
    ],
  },
];

export function AreaPag() {
  const [sel, setSel] = useState<string | null>("v1");
  const [b, setB] = useState(0.2);
  const [h, setH] = useState(0.5);
  return (
    <Pagina
      titulo="Área de trabalho, docks, árvore e propriedades"
      resumo="Casca comum das frentes (substitui os Docks.tsx divergentes). Docks com abas, largura arrastável (duplo clique na borda volta ao padrão), recolhem para uma faixa; propriedades editáveis sem abrir diálogo; barra de status com modos clicáveis."
      componentes={["AreaTrabalho", "Arvore", "GradePropriedades", "BarraStatus"]}
      criterios={["U09", "U03", "U11", "U13"]}
      uso={`<AreaTrabalho id="hidrosani"
  esquerda={[{ id: "arvore", titulo: "Projeto", conteudo: <Arvore nos={…} /> }]}
  direita={[{ id: "props", titulo: "Propriedades", conteudo: <GradePropriedades props={…} /> }]}
  baixo={[{ id: "res", titulo: "Resultados", conteudo: <TabelaDados … /> }]}
  status={<BarraStatus itens={["x 1,20", "y 3,40"]} modos={[…]} />}>
  <Prancheta2D … />
</AreaTrabalho>`}
    >
      <Demo altura={460}>
        <AreaTrabalho
          id="galeria-area"
          esquerda={[
            { id: "arvore", titulo: "Projeto", icone: "camadas", conteudo: <Arvore nos={ARVORE} selecionado={sel} onSelecionar={setSel} /> },
            { id: "cam", titulo: "Camadas", icone: "camadas", conteudo: <p className="p-3 text-[12px] text-texto-3">Outro painel no mesmo dock = aba.</p> },
          ]}
          direita={[
            {
              id: "props",
              titulo: "Propriedades",
              icone: "config",
              conteudo: (
                <GradePropriedades
                  titulo={sel ? `Elemento ${sel.toUpperCase()}` : undefined}
                  props={
                    sel
                      ? [
                          { id: "b", rotulo: "Largura b", grupo: "Seção", valor: b, unidade: "m" },
                          { id: "h", rotulo: "Altura h", grupo: "Seção", valor: h, unidade: "m" },
                          { id: "mat", rotulo: "Material", grupo: "Seção", valor: "C30", tipo: "opcao", opcoes: ["C25", "C30", "C35", "C40"] },
                          { id: "L", rotulo: "Comprimento", grupo: "Geometria", valor: "5,00 m", tipo: "texto" },
                          { id: "rot", rotulo: "Rotação", grupo: "Geometria", valor: 0, sufixo: "°" },
                        ]
                      : []
                  }
                  onChange={(id, v) => (id === "b" ? setB(Number(v)) : id === "h" ? setH(Number(v)) : null)}
                />
              ),
            },
          ]}
          baixo={[{ id: "log", titulo: "Mensagens", icone: "alerta", conteudo: <p className="p-2 font-mono text-[11px] text-texto-2">Verificação concluída: 0 erros, 2 avisos.</p> }]}
          status={<BarraStatus itens={["x 12,500", "y 3,000", "Pav. 2", "m · kN"]} modos={[{ rotulo: "GRADE", ativo: true, alternar: () => {} }, { rotulo: "GUIAS", ativo: true, alternar: () => {} }, { rotulo: "ORTO", ativo: false, alternar: () => {} }]} />}
        >
          <div className="flex h-full items-center justify-center text-[12px] text-texto-3">área de desenho (Prancheta2D / Viewport3D / Gantt)</div>
        </AreaTrabalho>
      </Demo>
    </Pagina>
  );
}

export function PranchetaPag() {
  const [modelo, setModelo] = useState<ModeloBarras>(() => ({ nos: [[0, 0, 0], [6, 0, 0], [6, 4, 0]], barras: [[0, 1], [1, 2]] }));
  const [ferr, setFerr] = useState<"barra" | "selecionar">("barra");
  const [guias, setGuias] = useState(true);
  const [sel, setSel] = useState<number | null>(null);
  const [info, setInfo] = useState<InfoCursor>(null);
  return (
    <Pagina
      titulo="Prancheta 2D"
      resumo="Base dos editores em planta/perfil. Ferramenta Barra: clique 2 pontos. O cursor gruda em nó, guia (tracejado de cada nó) e cruzamento de guias; o marcador diz o quê. Digite para coordenada (3 · @2,0 · @5<30), X/Y trava eixo, Shift = orto, F enquadra, botão do meio/direito move, roda dá zoom no mouse."
      componentes={["Prancheta2D"]}
      criterios={["U05", "U06", "U08", "U11"]}
      uso={`<Prancheta2D modelo={modelo} onChange={setModelo} ferramenta="barra" guias
  onCursor={(i) => setStatus(i)} />`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[12px]">
        <Segmentado valor={ferr} onChange={setFerr} opcoes={[{ valor: "barra", rotulo: "Barra" }, { valor: "selecionar", rotulo: "Selecionar" }]} />
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={guias} onChange={(e) => setGuias(e.target.checked)} /> Guias
        </label>
        <button className="h-7 border border-linha-forte bg-painel px-2" onClick={() => setModelo({ nos: [], barras: [] })}>
          Limpar
        </button>
        <span className="text-texto-3">{modelo.barras.length} barras</span>
      </div>
      <Demo altura={460} className="flex flex-col">
        <div className="min-h-0 flex-1">
          <Prancheta2D modelo={modelo} onChange={setModelo} ferramenta={ferr} guias={guias} selecionada={sel} onSelecionar={setSel} onCursor={setInfo} />
        </div>
        <BarraStatus
          itens={info ? [`x ${fmt(info.ponto[0])}`, `y ${fmt(info.ponto[1])}`, info.delta ? `Δ ${fmt(Math.hypot(info.delta[0], info.delta[1]))} m` : "", `encaixe: ${info.tipo}`] : ["mova o mouse sobre o desenho"]}
          modos={[{ rotulo: "GUIAS", ativo: guias, alternar: () => setGuias((g) => !g) }]}
        />
      </Demo>
    </Pagina>
  );
}

export function Vista3DPag() {
  const [modelo, setModelo] = useState<ModeloBarras>(PORTICO_EXEMPLO);
  const [plano, setPlano] = useState<"XY" | "XZ" | "YZ">("XZ");
  const [trava, setTrava] = useState<Eixo | null>(null);
  const [ferr, setFerr] = useState<"barra" | "selecionar">("barra");
  const [guias, setGuias] = useState(true);
  const [sel, setSel] = useState<number | null>(null);
  const [info, setInfo] = useState<InfoCursor>(null);
  const tema = typeof document !== "undefined" && document.documentElement.dataset.tema === "escuro" ? "escuro" : "claro";
  return (
    <Pagina
      titulo="Vista 3D + desenho de barras (em pé, deitada, inclinada)"
      resumo="O pedido do CYPE 3D. Plano de trabalho XY/XZ/YZ passando pelo último nó; guias tracejadas X/Y/Z saem de cada nó e acendem quando o cursor as segue; cruzamento de guias vira ponto de encaixe; X/Y/Z travam eixo; digite '@0,0,3' para pilar. Cores: azul em pé, verde deitada, laranja inclinada. Cubo de vistas no canto."
      componentes={["Viewport3D", "GradeAdaptativa"]}
      criterios={["U05", "U06", "U07", "U08", "U03"]}
      uso={`import { Viewport3D } from "@craft/ui/viewport";

<Viewport3D modelo={modelo} onChange={setModelo} plano="XZ" trava={trava} onTrava={setTrava}
  ferramenta="barra" guias corPorOrientacao onCursor={setStatus} />`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[12px]">
        <Segmentado valor={ferr} onChange={setFerr} opcoes={[{ valor: "barra", rotulo: "Barra" }, { valor: "selecionar", rotulo: "Selecionar" }]} />
        <span className="text-texto-3">Plano</span>
        <Segmentado valor={plano} onChange={setPlano} opcoes={[{ valor: "XY", rotulo: "XY planta" }, { valor: "XZ", rotulo: "XZ pórtico" }, { valor: "YZ", rotulo: "YZ pórtico" }]} />
        <span className="text-texto-3">Trava</span>
        <Segmentado valor={trava == null ? "-" : "XYZ"[trava]} onChange={(v) => setTrava(v === "-" ? null : ("XYZ".indexOf(v) as Eixo))} opcoes={[{ valor: "-", rotulo: "—" }, { valor: "X", rotulo: "X" }, { valor: "Y", rotulo: "Y" }, { valor: "Z", rotulo: "Z" }]} />
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={guias} onChange={(e) => setGuias(e.target.checked)} /> Guias
        </label>
        <button className="h-7 border border-linha-forte bg-painel px-2" onClick={() => setModelo(PORTICO_EXEMPLO)}>
          Reiniciar
        </button>
      </div>
      <Demo altura={520} className="flex flex-col">
        <div className="min-h-0 flex-1">
          <Suspense fallback={<div className="p-4 text-[12px] text-texto-3">Carregando 3D…</div>}>
            <Viewport3D key={tema} modelo={modelo} onChange={setModelo} plano={plano} trava={trava} onTrava={setTrava} ferramenta={ferr} guias={guias} selecionada={sel} onSelecionar={setSel} onCursor={setInfo} tema={tema} />
          </Suspense>
        </div>
        <BarraStatus
          itens={info ? [`x ${fmt(info.ponto[0])}`, `y ${fmt(info.ponto[1])}`, `z ${fmt(info.ponto[2])}`, info.delta ? `Δ ${info.delta.map(fmt).join("; ")}` : "", `encaixe: ${info.tipo}`] : [`${modelo.barras.length} barras · ${modelo.nos.length} nós`]}
          modos={[{ rotulo: "GUIAS", ativo: guias, alternar: () => setGuias((g) => !g) }]}
        />
      </Demo>
    </Pagina>
  );
}

export { Viewport3D as Viewport3DLazy };
