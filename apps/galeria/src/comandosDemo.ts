import type { Comando, GuiaRibbon } from "@craft/ui";

/** Comandos de demonstração (os apps registram os seus — mesma forma). */
export function comandosDemo(log: (t: string) => void, extra: Partial<Record<string, Partial<Comando>>> = {}): Comando[] {
  const c = (id: string, rotulo: string, icone: Comando["icone"], categoria: string, atalho?: string, contexto?: string[]): Comando => ({
    id,
    rotulo,
    icone,
    categoria,
    atalho,
    contexto,
    executar: () => log(rotulo),
    ...extra[id],
  });
  return [
    c("novo", "Novo", "novo", "Arquivo", "Ctrl+N"),
    c("abrir", "Abrir", "abrir", "Arquivo", "Ctrl+O"),
    c("salvar", "Salvar", "salvar", "Arquivo", "Ctrl+S"),
    c("exportar", "Exportar", "exportar", "Arquivo"),
    c("imprimir", "Imprimir", "imprimir", "Arquivo", "Ctrl+P"),
    c("desfazer", "Desfazer", "desfazer", "Editar", "Ctrl+Z"),
    c("refazer", "Refazer", "refazer", "Editar", "Ctrl+Y"),
    c("selecionar", "Selecionar", "selecionar", "Desenhar", "Esc"),
    c("barra", "Barra", "barra", "Desenhar", "B"),
    c("pilar", "Pilar", "pilar", "Desenhar", "P"),
    c("viga", "Viga", "viga", "Desenhar", "V"),
    c("laje", "Laje", "laje", "Desenhar", "L"),
    c("no", "Nó", "no", "Desenhar", "N"),
    c("tubo", "Tubo", "tubo", "Desenhar", "T"),
    c("copiar", "Copiar", "copiar", "Modificar", "Ctrl+C"),
    c("mover", "Mover", "mover", "Modificar", "M"),
    c("espelhar", "Espelhar", "espelhar", "Modificar"),
    c("girar", "Girar", "girar", "Modificar", "R"),
    c("apagar", "Apagar", "apagar", "Modificar", "Del"),
    c("cota", "Cota", "cota", "Anotar", "D"),
    c("grade", "Grade", "grade", "Exibir", "G"),
    c("guias", "Guias", "guias", "Exibir", "Shift+G"),
    c("camadas", "Camadas", "camadas", "Exibir"),
    c("vista3d", "Vista 3D", "vista3d", "Exibir", "F3"),
    c("planta", "Planta", "planta", "Exibir", "F2"),
    c("zoomTudo", "Enquadrar", "zoomTudo", "Exibir", "F"),
    c("calcular", "Calcular", "calcular", "Análise", "F5"),
    c("config", "Opções", "config", "Análise"),
    c("secao", "Seção", "secao", "Barra", undefined, ["barra"]),
    c("carga", "Carga", "carga", "Barra", undefined, ["barra", "no"]),
    c("girarEixo", "Girar eixo", "girar", "Barra", undefined, ["barra"]),
    c("dividir", "Dividir", "dividir", "Barra", undefined, ["barra"]),
    c("apoio", "Apoio", "apoio", "Nó", undefined, ["no"]),
    c("travarNo", "Travar nó", "travar", "Nó", undefined, ["no"]),
  ];
}

export const GRUPOS_PADRAO = [["selecionar", "desfazer", "refazer"], ["barra", "pilar", "viga", "laje", "no"], ["copiar", "mover", "espelhar", "apagar"], ["cota", "grade", "guias"], ["calcular"]];

export const GUIAS_DEMO: GuiaRibbon[] = [
  { id: "arquivo", rotulo: "ARQUIVO", grupos: [{ rotulo: "Projeto", comandos: ["novo", "abrir", "salvar"] }, { rotulo: "Saída", comandos: ["exportar", "imprimir"] }] },
  {
    id: "desenhar",
    rotulo: "DESENHAR",
    grupos: [
      { rotulo: "Elementos", comandos: ["barra", "pilar", "viga", "laje"] },
      { rotulo: "Pontos", comandos: ["no"] },
      { rotulo: "Instalações", comandos: ["tubo"] },
      { rotulo: "Anotar", comandos: ["cota"] },
    ],
  },
  {
    id: "modificar",
    rotulo: "MODIFICAR",
    grupos: [
      { rotulo: "Transformar", comandos: ["copiar", "mover", "girar", "espelhar"] },
      { rotulo: "Remover", comandos: ["apagar"] },
      { rotulo: "Histórico", comandos: ["desfazer", "refazer"] },
    ],
  },
  { id: "exibir", rotulo: "EXIBIR", grupos: [{ rotulo: "Vistas", comandos: ["planta", "vista3d", "zoomTudo"] }, { rotulo: "Auxiliares", comandos: ["grade", "guias", "camadas"] }] },
  { id: "analise", rotulo: "ANÁLISE", grupos: [{ rotulo: "Rodar", comandos: ["calcular"] }, { rotulo: "Opções", comandos: ["config"] }] },
];

export const GUIAS_CONTEXTO: Record<string, GuiaRibbon> = {
  barra: { id: "barra", rotulo: "BARRA", grupos: [{ rotulo: "Propriedades", comandos: ["secao", "girarEixo"] }, { rotulo: "Ações", comandos: ["carga", "dividir"] }] },
  no: { id: "no", rotulo: "NÓ", grupos: [{ rotulo: "Vinculação", comandos: ["apoio", "travarNo"] }, { rotulo: "Ações", comandos: ["carga"] }] },
};
