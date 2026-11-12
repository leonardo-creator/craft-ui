import { useMemo, useState } from "react";
import { DiagramaBarra, DiagramaNos, Gantt, GraficoXY, intersecoes, PerfilLongitudinal, Segmentado, Sparkline, caminhoCritico, formatarNumero, type TarefaGantt } from "@craft/ui";
import { Demo, Pagina } from "../Pagina";

export function GraficosPag() {
  const [rot, setRot] = useState<"100" | "90">("100");
  const fator = rot === "100" ? 1 : 0.9;
  // curvas de bomba (lei de afinidade) × sistema
  const bomba = useMemo<[number, number][]>(() => Array.from({ length: 31 }, (_, i) => [i * 2 * fator, (52 - 0.012 * (i * 2) ** 2) * fator * fator]), [fator]);
  const sistema = useMemo<[number, number][]>(() => Array.from({ length: 31 }, (_, i) => [i * 2, 12 + 0.009 * (i * 2) ** 2]), []);
  const op = intersecoes(bomba, sistema)[0];
  const eps = useMemo<[number, number][]>(() => Array.from({ length: 25 }, (_, h) => [h, 18 + 6 * Math.sin(((h - 6) / 24) * 2 * Math.PI) + (h % 5 === 0 ? 1.2 : 0)]), []);
  const demanda = useMemo<[number, number][]>(() => Array.from({ length: 25 }, (_, h) => [h, [0.6, 0.5, 0.5, 0.5, 0.6, 0.8, 1.2, 1.5, 1.4, 1.2, 1.1, 1.2, 1.3, 1.2, 1.1, 1.0, 1.1, 1.3, 1.5, 1.4, 1.2, 1.0, 0.8, 0.7, 0.6][h]]), []);

  return (
    <Pagina
      titulo="Gráficos e diagramas"
      resumo="Base dos 17 gráficos das frentes — todos eram SVG feito à mão com largura fixa (W=760), cores soltas e eixos refeitos em cada arquivo. Agora: ajustam ao espaço, marcas bonitas em pt-BR, unidade no eixo, mira com o valor de todas as séries, legenda que liga/desliga, zoom (roda) e mover (arrastar), duplo clique = tudo. SVG puro, sem biblioteca externa."
      componentes={["GraficoXY", "DiagramaBarra", "PerfilLongitudinal", "Gantt", "DiagramaNos", "Sparkline"]}
      criterios={["U16", "U12", "U14"]}
      uso={`<GraficoXY tituloX="Vazão" unidadeX="L/s" tituloY="Altura" unidadeY="m.c.a."
  series={[{ id: "b", nome: "Bomba", pontos }, { id: "s", nome: "Sistema", pontos: sist }]}
  pontos={[{ x: q, y: h, rotulo: "ponto de operação" }]} />

<DiagramaBarra esforco="M" unidade="kN·m" comprimento={6} valores={m} />
<PerfilLongitudinal nos={pvs} diametro={0.2} linhaAgua={na} />
<Gantt inicio="2026-11-12" tarefas={t} hoje={3} onAlterar={(id, ini, dur) => …} />
<DiagramaNos nos={nos} arestas={[["A","B"]]} />`}
    >
      <h3 className="mb-2 text-[13px] font-semibold">Curvas — ponto de operação (05 GraficoCurvas, 07 GraficoCurvaModal)</h3>
      <div className="mb-2 flex items-center gap-2 text-[12px]">
        <span className="text-texto-3">Rotação da bomba</span>
        <Segmentado valor={rot} onChange={setRot} opcoes={[{ valor: "100", rotulo: "100%" }, { valor: "90", rotulo: "90%" }]} />
        {op && (
          <span className="font-mono text-texto-2">
            Q = {formatarNumero(op[0], 0.1)} L/s · H = {formatarNumero(op[1], 0.1)} m.c.a.
          </span>
        )}
      </div>
      <Demo className="p-2">
        <GraficoXY
          tituloX="Vazão"
          unidadeX="L/s"
          tituloY="Altura manométrica"
          unidadeY="m.c.a."
          yComZero
          series={[
            { id: "bomba", nome: `Bomba (${rot}%)`, pontos: bomba, cor: "#2563eb" },
            { id: "sistema", nome: "Curva do sistema", pontos: sistema, cor: "#dc2626" },
          ]}
          pontos={op ? [{ x: op[0], y: op[1], rotulo: "ponto de operação" }] : []}
          referencias={[{ eixo: "y", valor: 15, rotulo: "pressão mínima 15 m.c.a.", cor: "var(--cr-alerta)" }]}
        />
      </Demo>

      <h3 className="mb-2 mt-6 text-[13px] font-semibold">Série temporal EPS — linha + degrau (05 GraficoEps, 07 Hidrograma)</h3>
      <Demo className="p-2">
        <GraficoXY
          tituloX="Tempo"
          unidadeX="h"
          tituloY="Pressão"
          unidadeY="m.c.a."
          tituloY2="Fator de demanda"
          unidadeY2="×"
          altura={260}
          series={[
            { id: "p", nome: "Pressão no nó J-12", pontos: eps, unidade: "m.c.a.", marcadores: true },
            { id: "d", nome: "Padrão de demanda", pontos: demanda, estilo: "degrau", unidade: "×", cor: "#d97706", eixo: "dir" },
          ]}
          referencias={[{ eixo: "x", valor: 8, rotulo: "pico manhã" }]}
        />
      </Demo>

      <h3 className="mb-2 mt-6 text-[13px] font-semibold">Diagramas de esforços (01 DiagramasNVM, 06/08)</h3>
      <Demo className="grid gap-1 p-2 md:grid-cols-3">
        <DiagramaBarra esforco="N" unidade="kN" comprimento={6} rotuloBarra="V1" valores={Array.from({ length: 31 }, (_, i) => [i * 0.2, -85 + i * 0.3])} />
        <DiagramaBarra esforco="V" unidade="kN" comprimento={6} rotuloBarra="V1" valores={Array.from({ length: 31 }, (_, i) => [i * 0.2, 36 - 12 * i * 0.2])} />
        <DiagramaBarra esforco="M" unidade="kN·m" comprimento={6} rotuloBarra="V1" valores={Array.from({ length: 31 }, (_, i) => { const x = i * 0.2; return [x, -30 + 36 * x - 6 * x * x]; })} />
      </Demo>

      <h3 className="mb-2 mt-6 text-[13px] font-semibold">Perfil longitudinal (05 GraficoPerfil, 07 PerfilLongitudinal)</h3>
      <Demo className="p-2">
        <PerfilLongitudinal
          diametro={0.2}
          nos={[
            { nome: "PV-01", x: 0, cotaTerreno: 312.4, cotaFundo: 310.9 },
            { nome: "PV-02", x: 48, cotaTerreno: 311.8, cotaFundo: 310.3 },
            { nome: "PV-03", x: 96, cotaTerreno: 312.6, cotaFundo: 309.6 },
            { nome: "PV-04", x: 151, cotaTerreno: 310.2, cotaFundo: 308.8 },
            { nome: "PV-05", x: 199, cotaTerreno: 309.1, cotaFundo: 308.1 },
          ]}
          linhaAgua={[
            [0, 311.0],
            [48, 310.41],
            [96, 309.73],
            [151, 308.95],
            [199, 308.24],
          ]}
        />
      </Demo>

      <h3 className="mb-2 mt-6 text-[13px] font-semibold">Gantt (04 Gantt + PlanilhaGantt)</h3>
      <GanttDemo />

      <h3 className="mb-2 mt-6 text-[13px] font-semibold">Diagrama de rede / PERT (04 DiagramaRede/Pert, 03 Unifilar)</h3>
      <RedeDemo />

      <h3 className="mb-2 mt-6 text-[13px] font-semibold">Sparkline em tabela (05 Sparkline)</h3>
      <Demo className="p-2">
        <table className="text-[12px]">
          <tbody>
            {[
              ["J-01", [22, 21, 20, 18, 17, 18, 20, 21]],
              ["J-12", [17, 16, 15, 13, 12, 14, 15, 16]],
              ["J-30", [30, 30, 29, 29, 28, 29, 30, 30]],
            ].map(([n, v]) => (
              <tr key={n as string} className="border-b border-linha">
                <td className="py-1 pr-4 font-mono">{n as string}</td>
                <td className="py-1">
                  <Sparkline valores={v as number[]} limite={{ valor: 15, tipo: "min" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Demo>
    </Pagina>
  );
}

const TAREFAS: TarefaGantt[] = [
  { id: "r1", nome: "Fundação", inicio: 0, duracao: 14, resumo: true, nivel: 0 },
  { id: "t1", nome: "Locação da obra", inicio: 0, duracao: 3, nivel: 1, progresso: 1, linhaBase: { inicio: 0, duracao: 3 } },
  { id: "t2", nome: "Escavação", inicio: 3, duracao: 5, nivel: 1, predecessoras: ["t1"], progresso: 0.6, linhaBase: { inicio: 3, duracao: 4 } },
  { id: "t3", nome: "Armação de sapatas", inicio: 3, duracao: 4, nivel: 1, predecessoras: ["t1"], progresso: 0.3 },
  { id: "t4", nome: "Concretagem sapatas", inicio: 8, duracao: 2, nivel: 1, predecessoras: ["t2", "t3"] },
  { id: "t5", nome: "Cura", inicio: 10, duracao: 4, nivel: 1, predecessoras: ["t4"] },
  { id: "m1", nome: "Fundação concluída", inicio: 14, duracao: 0, marco: true, nivel: 1, predecessoras: ["t5"] },
  { id: "r2", nome: "Estrutura", inicio: 14, duracao: 30, resumo: true, nivel: 0 },
  { id: "t6", nome: "Pilares térreo", inicio: 14, duracao: 6, nivel: 1, predecessoras: ["m1"] },
  { id: "t7", nome: "Vigas e laje 1º pav.", inicio: 20, duracao: 10, nivel: 1, predecessoras: ["t6"] },
  { id: "t8", nome: "Instalações embutidas", inicio: 22, duracao: 5, nivel: 1, predecessoras: ["t6"] },
  { id: "t9", nome: "Pilares 1º pav.", inicio: 30, duracao: 6, nivel: 1, predecessoras: ["t7", "t8"] },
  { id: "t10", nome: "Laje cobertura", inicio: 36, duracao: 8, nivel: 1, predecessoras: ["t9"] },
  { id: "m2", nome: "Estrutura concluída", inicio: 44, duracao: 0, marco: true, nivel: 1, predecessoras: ["t10"] },
];

function GanttDemo() {
  const [tarefas, setTarefas] = useState(TAREFAS);
  const [sel, setSel] = useState<string | null>("t2");
  return (
    <Gantt
      inicio="2026-11-12"
      tarefas={tarefas}
      hoje={5}
      selecionada={sel}
      onSelecionar={setSel}
      onAlterar={(id, ini, dur) => setTarefas((ts) => ts.map((t) => (t.id === id ? { ...t, inicio: ini, duracao: dur } : t)))}
    />
  );
}

function RedeDemo() {
  const crit = caminhoCritico(TAREFAS.filter((t) => !t.resumo));
  const [sel, setSel] = useState<string | null>(null);
  const reais = TAREFAS.filter((t) => !t.resumo);
  return (
    <DiagramaNos
      nos={reais.map((t) => ({ id: t.id, titulo: t.nome, linhas: [`ES ${t.inicio} · EF ${t.inicio + t.duracao}`, t.marco ? "marco" : `${t.duracao} d`], destaque: crit.has(t.id) ? "critico" : null }))}
      arestas={reais.flatMap((t) => (t.predecessoras ?? []).filter((p) => reais.some((r) => r.id === p)).map((p) => [p, t.id] as [string, string]))}
      selecionado={sel}
      onSelecionar={setSel}
    />
  );
}
