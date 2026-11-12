# Plano — completar a galeria com as telas que faltam (Parte 1)

> **Para o agente que vai executar.** Este é o trabalho principal. Leia inteiro antes de começar.
> Você vai criar, **dentro deste repositório (craft-ui)**, versões melhoradas das telas das 7
> frentes que ainda não têm versão na galeria. **Você NÃO mexe nas frentes** (`/root/rea-vps/fronts`
> é só leitura para você). A troca nas frentes é decisão do dono e está na Parte 2
> (`docs/PLANO-MIGRACAO.md`), que **não** é para executar agora.

## 1. Situação de partida

- Biblioteca `packages/ui` (`@craft/ui`) já tem as peças-base: comandos (BarraFerramentas, Ribbon,
  PaletaComandos, MenuContexto), Dialogo, Campo/GrupoCampos/InputEngenharia/Selecao/Alternar/Segmentado/Botao,
  AreaTrabalho/Arvore/GradePropriedades/BarraStatus, TabelaDados, Prancheta2D, Viewport3D (`@craft/ui/viewport`),
  gráficos (GraficoXY, DiagramaBarra, PerfilLongitudinal, Gantt, DiagramaNos, Sparkline) e Icone.
- Galeria `apps/galeria`: uma página por peça + **Catálogo** dos 450 componentes atuais + app de exemplo.
- Critérios de UX: `docs/CRITERIOS.md` (U01–U16). Toda tela nova cumpre os que se aplicam.
- Rodar: `npm install`, `npm run dev` (http://localhost:5190), `npm test`, `npm run build`.

**O que falta:** ~386 telas próprias de cada programa (diálogos e telas de engenharia como Sapatas,
Vento, Sprinklers, Hidrantes, Combinações, Padrões, Cenários…). Contagem por frente
(componente / linhas no original):

| Frente | Telas | Linhas no original | Maior grupo |
|---|---|---|---|
| 01 Eberick | 88 | 20.798 | telas de engenharia (77) |
| 03 QiBuilder | 113 | 32.537 | telas de engenharia (91) |
| 04 Project | 26 | 8.739 | diálogos (14), painéis (7) |
| 05 WaterGEMS | 28 | 19.244 | painéis (25) |
| 06 SAP2000 | 58 | 14.615 | diálogos `Modal*` (42) |
| 07 SewerGEMS | 70 | 36.731 | diálogos `*Modal` (57) |
| 08 CYPE 3D | 3 | 4.298 | diálogos/painel |

A lista nominal é `apps/galeria/src/dados/inventario.json` (campos: `f` frente, `n` nome, `l` linhas,
`c` categoria, `s` peças-base sugeridas). Filtre fora os já cobertos por peça genérica
(Ribbon, Docks, Visao3D, InputEngenharia, icones, App, gráficos).

## 2. O que é UMA unidade de trabalho

Uma **tela** = a versão melhorada de um componente original, na galeria:

1. **Ler o original (só leitura):** `find /root/rea-vps/fronts/XX -name "<Nome>.tsx" -not -path "*/node_modules/*"`.
   Anote: campos (rótulo, unidade, faixa, padrão), grupos, botões/ações, validações, o que é
   calculado pelo motor (não copie o cálculo), e a referência normativa citada no comentário.
   Se existir `fronts/XX/FUNCOES.md`, veja a linha da função para saber o que ela faz no original.
2. **Criar** `apps/galeria/src/telas/<XX>/<Nome>.tsx` usando **só** `react` e `@craft/ui`
   (nada de HTML de formulário solto, nada de cor fixa — tokens). Dados vêm de um **mock**
   em `apps/galeria/src/telas/<XX>/mocks.ts` (valores plausíveis, unidades corretas).
3. **Melhorar de verdade** (é o objetivo, não só trocar a moldura):
   - campos agrupados por assunto (`GrupoCampos`), rótulo + unidade + norma (`Campo norma=`);
   - números com `InputEngenharia` (unidade do campo, `min`/`max`, `passo`);
   - escolhas curtas com `Segmentado`, longas com `Selecao`, liga/desliga com `Alternar`;
   - validação na faixa de erro do `Dialogo` com mensagem que diz **o que fazer**;
   - telas de edição contínua com `modal={false}` + `id`;
   - listas/resultados em `TabelaDados`; curvas em `GraficoXY`; esquemas em `DiagramaNos`;
   - ações principais também como `Comando` (para aparecerem na paleta Ctrl+K).
4. **Registrar** em `apps/galeria/src/telas/registro.ts`:
   ```ts
   { frente: "06", nome: "ModalVento", titulo: "Definir ▸ Vento", original: "06/repo/engine/app/src/ModalVento.tsx",
     criterios: ["U04", "U10"], componente: lazy(() => import("./06/ModalVento")) }
   ```
5. **Página** — a galeria ganha a seção **"Telas por frente"** (crie na 1ª entrega): menu por frente,
   cada tela abre com botão "Abrir" (diálogos) ou embutida (painéis), e um quadro com
   *"Original: X linhas · Agora: Y linhas · O que melhorou: …"* (3 a 5 itens objetivos).
6. **Catálogo** — marcar a tela como feita: no `inventario.json` acrescente `"g": true` ao item;
   o Catálogo mostra uma coluna "Na galeria" e o total por frente.

## 3. Ordem e lotes

- **Lote = 10 telas da mesma frente**, um commit por lote (`feat(galeria): 06 lote 1 — 10 diálogos`).
- Ordem das frentes: **06 → 07 → 04 → 05 → 01 → 03 → 08**
  (06/07 são diálogos de formulário quase puros — rendem rápido e firmam o padrão; 01/03 têm mais
  telas com desenho e lógica própria).
- Dentro da frente: primeiro as telas ligadas a linhas **✓✓✓** do `FUNCOES.md` da frente (as mais
  usadas), depois o resto em ordem alfabética.
- A cada 3 lotes, pare e confira o conjunto (consistência entre frentes: mesmo jeito de pedir a mesma coisa).

## 4. Lacunas da biblioteca (fazer quando uma tela precisar — no `packages/ui`)

Quando a tela pedir algo que a biblioteca não tem, **não improvise na tela**: crie no `packages/ui`,
com teste (vitest) e uma página/seção na galeria, e só então use. Já se sabe que vão aparecer:

| Lacuna | Quem precisa | Peça a criar |
|---|---|---|
| Quadro Kanban (colunas, cartões arrastáveis) | 04 Kanban | `QuadroKanban` |
| Lista editável de linhas (tabela pequena com + / − / reordenar) | combinações, padrões, curvas por pontos | `ListaEditavel` (sobre `TabelaDados`) |
| Assistente em passos (wizard) | criação de projeto, lançamento automático | `Assistente` |
| Seletor de cor / hachura / tipo de linha | camadas, simbologia | `SeletorEstilo` |
| Camadas extras no `Viewport3D` (tubos, lajes, nós de rede) | 01, 03, 05, 07 | prop `camadas` no Viewport3D |
| Seleção por janela (retângulo) 2D/3D | editores | em `Prancheta2D`/`Viewport3D` |
| Virtualização em `TabelaDados` (> 5.000 linhas) | resultados grandes | opção `virtual` |
| Teste de componente (Testing Library) | Dialogo, BarraFerramentas, TabelaDados | `*.test.tsx` |

## 5. Regras

- **Só leitura** em `/root/rea-vps/fronts/**`. Nenhum commit, branch, build ou arquivo novo lá.
  Respeite `/root/rea-vps/AGENTS.md` (as 7 frentes têm executores rodando): nada de build pesado na VPS
  por causa deste trabalho — rode a galeria fora das lanes da frota ou localmente.
- **Não copie código das frentes** para a galeria (nem para a biblioteca). Leia, entenda, reescreva
  com as peças. Comentários podem citar o original pelo caminho.
- **Telas só importam `react` e `@craft/ui`.** Conferir antes de cada commit:
  `grep -rLE "from \"@craft/ui" apps/galeria/src/telas --include=*.tsx` (deve listar só `mocks`/`registro`) e
  `grep -rnE "#[0-9a-fA-F]{3,6}\b" apps/galeria/src/telas` (sem cor fixa).
- **Nada de cálculo de engenharia** nas telas — o motor (Rust) é que calcula. Mocks trazem resultados prontos.
- Português do Brasil em tudo que aparece na tela, com acentos.
- Não suba dependência nova sem necessidade; se precisar, justifique no commit.

## 6. Aceite (por lote)

- `npm test` verde, `npm run typecheck` sem erro, `npm run build` ok.
- Cada tela nova abre na galeria **sem erro no console** (abrir cada uma no navegador).
- Para 2 telas do lote: roteiro de teclado — abrir, Tab por todos os campos, digitar valor inválido
  (vê erro na faixa), Esc cancela, Enter confirma.
- Catálogo atualizado (`"g": true`) e contagem da frente confere.
- Commit no `main` do craft-ui com a lista das 10 telas na mensagem.

## 7. Definição de pronto (Parte 1 inteira)

- Todas as ~386 telas com `"g": true` (ou marcadas `"g": "descartada"` com motivo — ex.: tela que é só
  um wrapper do motor sem UI própria).
- Lacunas da §4 resolvidas na biblioteca, com teste.
- Página "Telas por frente" mostrando progresso 100% por frente.
- Zero arquivo alterado em `/root/rea-vps/fronts`.

---

Parte 2 (troca nas frentes) → `docs/PLANO-MIGRACAO.md` — **só quando o dono decidir.**
