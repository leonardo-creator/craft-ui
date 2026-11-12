/**
 * App de exemplo montado SÓ com @craft/ui — o "antes × depois" de uma frente
 * estrutural (01/06/08): ribbon + barra + docks + vista 3D + propriedades +
 * tabela + status + paleta. Serve de referência para a migração.
 */
import { Suspense, useMemo, useState } from "react";
import {
  AreaTrabalho,
  Arvore,
  BarraFerramentas,
  BarraStatus,
  GradePropriedades,
  PaletaComandos,
  ProvedorComandos,
  Ribbon,
  TabelaDados,
  distancia,
  orientacao,
  useBarraFerramentas,
  PORTICO_EXEMPLO,
  type Eixo,
  type Encaixe,
  type ModeloBarras,
  type Vec3,
} from "@craft/ui";
import { comandosDemo, GUIAS_CONTEXTO, GUIAS_DEMO } from "../comandosDemo";
import { Viewport3DLazy as Viewport3D } from "./Editores";

const fmt = (v: number) => v.toFixed(2).replace(".", ",");

export function AppCompleto() {
  const [modelo, setModelo] = useState<ModeloBarras>(PORTICO_EXEMPLO);
  const [ferr, setFerr] = useState<"barra" | "selecionar">("selecionar");
  const [plano, setPlano] = useState<"XY" | "XZ" | "YZ">("XZ");
  const [trava, setTrava] = useState<Eixo | null>(null);
  const [guias, setGuias] = useState(true);
  const [grade] = useState(true);
  const [sel, setSel] = useState<number | null>(null);
  const [info, setInfo] = useState<{ ponto: Vec3; delta: Vec3 | null; tipo: Encaixe["tipo"] } | null>(null);
  const [msg, setMsg] = useState("pronto");
  const [personalizando, setPersonalizando] = useState(false);

  const comandos = useMemo(
    () =>
      comandosDemo((t) => setMsg(`comando: ${t}`), {
        barra: { executar: () => setFerr("barra"), ativo: ferr === "barra" },
        selecionar: { executar: () => (setFerr("selecionar"), setTrava(null)), ativo: ferr === "selecionar" },
        pilar: { executar: () => (setFerr("barra"), setPlano("XZ"), setTrava(2)) },
        viga: { executar: () => (setFerr("barra"), setPlano("XY"), setTrava(null)) },
        guias: { executar: () => setGuias((g) => !g), ativo: guias },
        apagar: {
          executar: () => {
            if (sel == null) return;
            setModelo((m) => ({ ...m, barras: m.barras.filter((_, i) => i !== sel) }));
            setSel(null);
          },
          habilitado: sel != null,
        },
        desfazer: { executar: () => setModelo((m) => ({ ...m, barras: m.barras.slice(0, -1) })) },
      }),
    [ferr, guias, sel],
  );
  const barra = useBarraFerramentas("app-exemplo", [["selecionar", "desfazer"], ["barra", "pilar", "viga", "no"], ["copiar", "mover", "apagar"], ["guias", "grade"], ["calcular"]], { densidade: "icone", posicao: "esquerda" });
  const contexto = sel != null ? "barra" : null;
  const linhas = modelo.barras.map(([a, b], i) => ({ id: i, nome: `B${i + 1}`, L: distancia(modelo.nos[a], modelo.nos[b]), tipo: { "em-pe": "pilar", deitada: "viga", inclinada: "diagonal" }[orientacao(modelo.nos[a], modelo.nos[b])] }));
  const barraSel = sel != null ? linhas[sel] : null;

  return (
    <ProvedorComandos comandos={comandos}>
      <div className="h-[calc(100vh-0px)]">
        <AreaTrabalho
          id="app-exemplo"
          ribbon={<Ribbon id="app-exemplo" guias={GUIAS_DEMO} guiasContextuais={GUIAS_CONTEXTO} contexto={contexto} aDireita={<span className="text-[11px] font-semibold text-texto-2">StructCraft · exemplo</span>} />}
          posicaoBarra={barra.posicao}
          barra={<BarraFerramentas estado={barra} contexto={contexto} personalizando={personalizando} onPersonalizando={setPersonalizando} />}
          esquerda={[
            {
              id: "arvore",
              titulo: "Modelo",
              icone: "camadas",
              conteudo: (
                <Arvore
                  nos={[{ id: "m", rotulo: "Pórtico", icone: "vista3d", info: `${linhas.length}`, filhos: linhas.map((l) => ({ id: String(l.id), rotulo: `${l.nome} · ${l.tipo}`, icone: l.tipo === "pilar" ? "pilar" : l.tipo === "viga" ? "viga" : "barra", info: `${fmt(l.L)} m` })) }]}
                  selecionado={sel != null ? String(sel) : null}
                  onSelecionar={(id) => setSel(id === "m" ? null : Number(id))}
                />
              ),
            },
          ]}
          direita={[
            {
              id: "props",
              titulo: "Propriedades",
              icone: "config",
              conteudo: (
                <GradePropriedades
                  titulo={barraSel ? `${barraSel.nome} — ${barraSel.tipo}` : undefined}
                  props={
                    barraSel
                      ? [
                          { id: "L", rotulo: "Comprimento", grupo: "Geometria", valor: `${fmt(barraSel.L)} m`, tipo: "texto" },
                          { id: "sec", rotulo: "Seção", grupo: "Seção", valor: "W200×22,5", tipo: "opcao", opcoes: ["W150×13", "W200×22,5", "W250×32,7", "20×40 C30"] },
                          { id: "rot", rotulo: "Ângulo do eixo", grupo: "Seção", valor: 0, sufixo: "°" },
                          { id: "q", rotulo: "Carga distribuída", grupo: "Ações", valor: 5, sufixo: "kN/m" },
                        ]
                      : []
                  }
                />
              ),
            },
          ]}
          baixo={[
            {
              id: "tab",
              titulo: "Barras",
              icone: "tabela",
              conteudo: (
                <div className="p-1">
                  <TabelaDados
                    altura={150}
                    colunas={[{ id: "nome", titulo: "Barra" }, { id: "tipo", titulo: "Tipo" }, { id: "L", titulo: "Comprimento", unidade: "m", tipo: "numero", casas: 2, total: true }]}
                    linhas={linhas}
                    selecionada={sel}
                    onSelecionar={(id) => setSel(Number(id))}
                  />
                </div>
              ),
            },
          ]}
          status={
            <BarraStatus
              itens={[
                info ? `x ${fmt(info.ponto[0])}  y ${fmt(info.ponto[1])}  z ${fmt(info.ponto[2])}` : "—",
                info?.delta ? `Δ ${fmt(Math.hypot(...info.delta))} m` : "",
                info ? `encaixe: ${info.tipo}` : "",
                `plano ${plano}`,
                msg,
              ]}
              modos={[
                { rotulo: "XY", ativo: plano === "XY", alternar: () => setPlano("XY"), titulo: "Plano de trabalho" },
                { rotulo: "XZ", ativo: plano === "XZ", alternar: () => setPlano("XZ") },
                { rotulo: "YZ", ativo: plano === "YZ", alternar: () => setPlano("YZ") },
                { rotulo: "GUIAS", ativo: guias, alternar: () => setGuias((g) => !g) },
                { rotulo: "GRADE", ativo: grade, alternar: () => {} },
              ]}
            />
          }
        >
          <Suspense fallback={<div className="p-4 text-[12px] text-texto-3">Carregando 3D…</div>}>
            <Viewport3D
              key={document.documentElement.dataset.tema ?? "claro"}
              modelo={modelo}
              onChange={setModelo}
              ferramenta={ferr}
              plano={plano}
              trava={trava}
              onTrava={setTrava}
              guias={guias}
              selecionada={sel}
              onSelecionar={setSel}
              onCursor={setInfo}
              tema={document.documentElement.dataset.tema === "escuro" ? "escuro" : "claro"}
            />
          </Suspense>
        </AreaTrabalho>
      </div>
      <PaletaComandos />
    </ProvedorComandos>
  );
}
