/**
 * Critérios de UI/UX — régua única das 7 frentes. Cada critério tem um
 * "como verificar" que dá para virar teste (Playwright/vitest) nas frentes.
 * Fonte também de docs/CRITERIOS.md.
 */
export interface Criterio {
  id: string;
  titulo: string;
  regra: string;
  verificar: string;
  componentes: string[];
}

export const CRITERIOS: Criterio[] = [
  {
    id: "U01",
    titulo: "Nada engessado",
    regra: "Barra e ribbon são DADO (ids do registro de comandos), não um callback por botão. O usuário reposiciona, personaliza e restaura.",
    verificar: "Arrastar comando da biblioteca para a barra, recarregar a página: continua lá. 'Restaurar padrão' volta ao layout do app.",
    componentes: ["BarraFerramentas", "Ribbon", "ProvedorComandos"],
  },
  {
    id: "U02",
    titulo: "Todo comando achável",
    regra: "Ctrl+K abre a paleta: busca sem acento, recentes primeiro, atalho visível. Tooltip de botão mostra nome + atalho.",
    verificar: "Ctrl+K → digitar 'pilar' → Enter executa. Em menos de 2 s, sem mouse.",
    componentes: ["PaletaComandos", "BotaoComando"],
  },
  {
    id: "U03",
    titulo: "Contexto primeiro",
    regra: "Selecionar algo mostra os comandos DELE (grupo roxo na barra / guia contextual no ribbon) e as propriedades no dock — sem abrir diálogo.",
    verificar: "Clicar numa barra: aparecem Seção/Carga/Dividir e a grade de propriedades da barra.",
    componentes: ["BarraFerramentas", "Ribbon", "GradePropriedades"],
  },
  {
    id: "U04",
    titulo: "Número de engenharia",
    regra: "Aceita vírgula pt-BR, milhar, fração (10/2) e unidade (25cm num campo em m = 0,25). Commit em Enter/Tab/blur; Esc restaura; erro em linha; ↑/↓ incrementam.",
    verificar: "Digitar '25cm' num campo em m → 0,25. Digitar 'abc' → borda vermelha + mensagem, texto preservado.",
    componentes: ["InputEngenharia", "TabelaDados", "GradePropriedades"],
  },
  {
    id: "U05",
    titulo: "Precisão sem digitar",
    regra: "Cursor encaixa em nó, guia tracejada X/Y/Z de cada nó, cruzamento de guias e grade. O marcador diz o que pegou (nó □, cruzamento ✕, guia ┼).",
    verificar: "Com 2 nós, passar o mouse alinhado ao X de um e ao Z do outro: marcador 'cruzamento' e as duas guias acesas.",
    componentes: ["Prancheta2D", "Viewport3D", "encaixar()"],
  },
  {
    id: "U06",
    titulo: "Precisão digitando",
    regra: "Começar a digitar no desenho abre a coordenada: '3' (na direção do cursor), '@0,0,3' (relativo), '4,0,3' (absoluto), '@2<45' (polar).",
    verificar: "Com a ferramenta Barra, clicar um ponto, digitar '@0,0,3' e Enter → pilar de 3 m.",
    componentes: ["EntradaCoordenada", "lerCoordenada()"],
  },
  {
    id: "U07",
    titulo: "Qualquer orientação",
    regra: "Plano de trabalho XY/XZ/YZ passa pelo último nó; teclas X/Y/Z travam o eixo. Barra em pé, deitada ou inclinada em 2 cliques.",
    verificar: "Plano XZ: clicar base e topo → pilar (azul). Clicar topo de um e base do outro → diagonal (laranja).",
    componentes: ["Viewport3D"],
  },
  {
    id: "U08",
    titulo: "Grade que se adapta",
    regra: "Passo 10ⁿ pelo zoom com rótulo (1 m → 10 cm), linha principal a cada 10, eixos coloridos na origem, esmaece ao longe, sem serrilhado.",
    verificar: "Dar zoom: o rótulo do passo muda e as linhas nunca viram borrão nem somem.",
    componentes: ["GradeAdaptativa", "Prancheta2D"],
  },
  {
    id: "U09",
    titulo: "Espaço para o desenho",
    regra: "Docks redimensionáveis, recolhíveis e em abas (não pilha espremida). O que não cabe vai para 'Mais'. Ribbon minimiza (Ctrl+F1).",
    verificar: "Estreitar a janela: nenhum botão quebra linha ou some sem ir para 'Mais'.",
    componentes: ["AreaTrabalho", "BarraFerramentas", "Ribbon"],
  },
  {
    id: "U10",
    titulo: "Diálogo previsível",
    regra: "Enter confirma, Esc cancela, foco preso e devolvido, erro em faixa fixa acima dos botões, um primário à direita. Não-modal quando precisa ver o modelo; lembra posição.",
    verificar: "Abrir, Tab até o fim volta ao começo; Esc fecha e o foco volta ao botão que abriu.",
    componentes: ["Dialogo", "Campo"],
  },
  {
    id: "U11",
    titulo: "Teclado completo",
    regra: "Árvore (↑↓→←), tabela (Enter/Tab), paleta e diálogos funcionam só no teclado; foco sempre visível.",
    verificar: "Percorrer a árvore e editar uma célula da tabela sem tocar no mouse.",
    componentes: ["Arvore", "TabelaDados", "PaletaComandos", "Dialogo"],
  },
  {
    id: "U12",
    titulo: "Tabela legível",
    regra: "Cabeçalho e 1ª coluna fixos, unidade no cabeçalho [kN], números em mono à direita, ordenar/filtrar, edição na célula, total no rodapé, linha crítica marcada por regra.",
    verificar: "Rolar a tabela: cabeçalho e 1ª coluna ficam. Clicar no cabeçalho ordena.",
    componentes: ["TabelaDados"],
  },
  {
    id: "U13",
    titulo: "Memória do usuário",
    regra: "Posição/layout da barra, tamanho dos docks, guia do ribbon, posição dos diálogos e recentes da paleta persistem — e sempre há 'Restaurar padrão'.",
    verificar: "Mudar tudo, recarregar: igual. Restaurar: volta ao padrão.",
    componentes: ["useBarraFerramentas", "AreaTrabalho", "Ribbon", "Dialogo"],
  },
  {
    id: "U14",
    titulo: "Tema por tokens",
    regra: "Claro e escuro só por tokens (--cr-*). Nenhuma cor solta no componente (exceto cores de eixo/orientação que são semânticas).",
    verificar: "Trocar o tema: nada fica ilegível ou com fundo branco perdido.",
    componentes: ["styles.css"],
  },
  {
    id: "U15",
    titulo: "Uma peça, sete apps",
    regra: "Componente compartilhado vem do @craft/ui. Proibido copiar para dentro da frente — a cópia foi a causa das 6 Ribbons e 5 Docks divergentes.",
    verificar: "grep nas frentes: nenhum Ribbon.tsx/Docks.tsx/Visao3D.tsx/InputEngenharia.tsx/icones.tsx local após a migração.",
    componentes: ["todos"],
  },
  {
    id: "U16",
    titulo: "Gráfico que se lê",
    regra: "Gráfico ocupa o espaço disponível (sem largura fixa), marcas 1-2-2,5-5 em pt-BR, unidade no título do eixo, mira mostra o valor de TODAS as séries no x do mouse, legenda liga/desliga série, roda = zoom e arrastar = mover (duplo clique volta). Diagramas de esforço seguem a convenção (M no lado tracionado) e rotulam extremos.",
    verificar: "Passar o mouse na curva: caixa com Q e H das duas séries. Clicar na legenda some a série. Roda no eixo X aproxima; duplo clique volta.",
    componentes: ["GraficoXY", "DiagramaBarra", "PerfilLongitudinal", "Gantt", "DiagramaNos", "Sparkline"],
  },
];
