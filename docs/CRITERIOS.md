# Critérios de UI/UX — @craft/ui

Régua única das 7 frentes REA. Fonte: `apps/galeria/src/criterios.ts` (a galeria mostra cada critério junto do componente que o cumpre).

## U01 — Nada engessado

Barra e ribbon são DADO (ids do registro de comandos), não um callback por botão. O usuário reposiciona, personaliza e restaura.

**Como verificar:** Arrastar comando da biblioteca para a barra, recarregar a página: continua lá. 'Restaurar padrão' volta ao layout do app.

**Componentes:** `BarraFerramentas`, `Ribbon`, `ProvedorComandos`

## U02 — Todo comando achável

Ctrl+K abre a paleta: busca sem acento, recentes primeiro, atalho visível. Tooltip de botão mostra nome + atalho.

**Como verificar:** Ctrl+K → digitar 'pilar' → Enter executa. Em menos de 2 s, sem mouse.

**Componentes:** `PaletaComandos`, `BotaoComando`

## U03 — Contexto primeiro

Selecionar algo mostra os comandos DELE (grupo roxo na barra / guia contextual no ribbon) e as propriedades no dock — sem abrir diálogo.

**Como verificar:** Clicar numa barra: aparecem Seção/Carga/Dividir e a grade de propriedades da barra.

**Componentes:** `BarraFerramentas`, `Ribbon`, `GradePropriedades`

## U04 — Número de engenharia

Aceita vírgula pt-BR, milhar, fração (10/2) e unidade (25cm num campo em m = 0,25). Commit em Enter/Tab/blur; Esc restaura; erro em linha; ↑/↓ incrementam.

**Como verificar:** Digitar '25cm' num campo em m → 0,25. Digitar 'abc' → borda vermelha + mensagem, texto preservado.

**Componentes:** `InputEngenharia`, `TabelaDados`, `GradePropriedades`

## U05 — Precisão sem digitar

Cursor encaixa em nó, guia tracejada X/Y/Z de cada nó, cruzamento de guias e grade. O marcador diz o que pegou (nó □, cruzamento ✕, guia ┼).

**Como verificar:** Com 2 nós, passar o mouse alinhado ao X de um e ao Z do outro: marcador 'cruzamento' e as duas guias acesas.

**Componentes:** `Prancheta2D`, `Viewport3D`, `encaixar()`

## U06 — Precisão digitando

Começar a digitar no desenho abre a coordenada: '3' (na direção do cursor), '@0,0,3' (relativo), '4,0,3' (absoluto), '@2<45' (polar).

**Como verificar:** Com a ferramenta Barra, clicar um ponto, digitar '@0,0,3' e Enter → pilar de 3 m.

**Componentes:** `EntradaCoordenada`, `lerCoordenada()`

## U07 — Qualquer orientação

Plano de trabalho XY/XZ/YZ passa pelo último nó; teclas X/Y/Z travam o eixo. Barra em pé, deitada ou inclinada em 2 cliques.

**Como verificar:** Plano XZ: clicar base e topo → pilar (azul). Clicar topo de um e base do outro → diagonal (laranja).

**Componentes:** `Viewport3D`

## U08 — Grade que se adapta

Passo 10ⁿ pelo zoom com rótulo (1 m → 10 cm), linha principal a cada 10, eixos coloridos na origem, esmaece ao longe, sem serrilhado.

**Como verificar:** Dar zoom: o rótulo do passo muda e as linhas nunca viram borrão nem somem.

**Componentes:** `GradeAdaptativa`, `Prancheta2D`

## U09 — Espaço para o desenho

Docks redimensionáveis, recolhíveis e em abas (não pilha espremida). O que não cabe vai para 'Mais'. Ribbon minimiza (Ctrl+F1).

**Como verificar:** Estreitar a janela: nenhum botão quebra linha ou some sem ir para 'Mais'.

**Componentes:** `AreaTrabalho`, `BarraFerramentas`, `Ribbon`

## U10 — Diálogo previsível

Enter confirma, Esc cancela, foco preso e devolvido, erro em faixa fixa acima dos botões, um primário à direita. Não-modal quando precisa ver o modelo; lembra posição.

**Como verificar:** Abrir, Tab até o fim volta ao começo; Esc fecha e o foco volta ao botão que abriu.

**Componentes:** `Dialogo`, `Campo`

## U11 — Teclado completo

Árvore (↑↓→←), tabela (Enter/Tab), paleta e diálogos funcionam só no teclado; foco sempre visível.

**Como verificar:** Percorrer a árvore e editar uma célula da tabela sem tocar no mouse.

**Componentes:** `Arvore`, `TabelaDados`, `PaletaComandos`, `Dialogo`

## U12 — Tabela legível

Cabeçalho e 1ª coluna fixos, unidade no cabeçalho [kN], números em mono à direita, ordenar/filtrar, edição na célula, total no rodapé, linha crítica marcada por regra.

**Como verificar:** Rolar a tabela: cabeçalho e 1ª coluna ficam. Clicar no cabeçalho ordena.

**Componentes:** `TabelaDados`

## U13 — Memória do usuário

Posição/layout da barra, tamanho dos docks, guia do ribbon, posição dos diálogos e recentes da paleta persistem — e sempre há 'Restaurar padrão'.

**Como verificar:** Mudar tudo, recarregar: igual. Restaurar: volta ao padrão.

**Componentes:** `useBarraFerramentas`, `AreaTrabalho`, `Ribbon`, `Dialogo`

## U14 — Tema por tokens

Claro e escuro só por tokens (--cr-*). Nenhuma cor solta no componente (exceto cores de eixo/orientação que são semânticas).

**Como verificar:** Trocar o tema: nada fica ilegível ou com fundo branco perdido.

**Componentes:** `styles.css`

## U15 — Uma peça, sete apps

Componente compartilhado vem do @craft/ui. Proibido copiar para dentro da frente — a cópia foi a causa das 6 Ribbons e 5 Docks divergentes.

**Como verificar:** grep nas frentes: nenhum Ribbon.tsx/Docks.tsx/Visao3D.tsx/InputEngenharia.tsx/icones.tsx local após a migração.

**Componentes:** `todos`

## U16 — Gráfico que se lê

Gráfico ocupa o espaço disponível (sem largura fixa), marcas 1-2-2,5-5 em pt-BR, unidade no título do eixo, mira mostra o valor de TODAS as séries no x do mouse, legenda liga/desliga série, roda = zoom e arrastar = mover (duplo clique volta). Diagramas de esforço seguem a convenção (M no lado tracionado) e rotulam extremos.

**Como verificar:** Passar o mouse na curva: caixa com Q e H das duas séries. Clicar na legenda some a série. Roda no eixo X aproxima; duplo clique volta.

**Componentes:** `GraficoXY`, `DiagramaBarra`, `PerfilLongitudinal`, `Gantt`, `DiagramaNos`, `Sparkline`
