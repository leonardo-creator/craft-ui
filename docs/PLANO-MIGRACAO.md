# Plano de migração das 7 frentes para o @craft/ui

> **Para quem vai executar (outro modelo/agente):** este documento é autossuficiente.
> Leia inteiro antes de mexer em qualquer arquivo. Ele diz O QUE fazer, EM QUE ORDEM,
> COMO PROVAR que ficou certo e O QUE NÃO FAZER. Na dúvida entre "mais rápido" e
> "não quebrar teste existente", escolha não quebrar.

---

## 0. Contexto em 1 minuto

- 7 frentes REA (clones de software de engenharia), todas **Tauri 2 + React + Tailwind + Vite**, na VPS em `/root/rea-vps/fronts/XX`:

  | Frente | Original | Repositório (conta `lnrdjuv`) | App (pasta) | Stack |
  |---|---|---|---|---|
  | 01 | Eberick | StructCraft | `fronts/01/app` | React 19 / TW 4 / three + R3F |
  | 03 | QiBuilder | BuilderCraft | `fronts/03/engine/app` | React 19 / TW 4 / three + R3F |
  | 04 | MS Project | ScheduleCraft | `fronts/04/product/app` | React 19 / TW 4 |
  | 05 | WaterGEMS | WaterCraft (branch `05-L216-powermeters` = a mais nova) | `fronts/05/05-L216-powermeters/app` | React 19 / TW 4 / three |
  | 06 | SAP2000 | MefCraft (branch `master`) | `fronts/06/repo/engine/app` | React 19 / TW 4 |
  | 07 | SewerGEMS | SewerCraft | `fronts/07/engine/app` | React 19 / TW 4 |
  | 08 | CYPE 3D | CypeCraft | `fronts/08/repo/app` | **React 18 / TW 3 / Vite 5** ← atrasada |

- O repositório **`leonardo-creator/craft-ui`** (privado) contém o pacote `@craft/ui` (em `packages/ui`) e a galeria (`apps/galeria`). Ele já tem versão única e melhorada de: comandos (barra, ribbon, paleta Ctrl+K, menu de contexto), diálogo, campos/InputEngenharia, área de trabalho/docks, árvore, propriedades, tabela, prancheta 2D, vista 3D com desenho de barras, e **gráficos** (GraficoXY, DiagramaBarra, PerfilLongitudinal, Gantt, DiagramaNos, Sparkline).
- **Rode a galeria primeiro** (`npm install && npm run dev` → `http://localhost:5190`). Cada página mostra o componente, os critérios U01–U16 que ele cumpre e o código de uso. O **Catálogo** lista os 450 componentes atuais e qual peça do @craft/ui assume cada um — é o seu mapa.
- Critérios de aceite de UX: `docs/CRITERIOS.md` (U01–U16).

## 1. Regras que NÃO se negociam

1. **Não quebrar os testes existentes da frente.** Cada frente tem specs Playwright (`e2e/`, vários `playwright*.config.ts`) e vitest. Eles localizam elementos por **`data-testid`** (306 a 1.963 por frente). **Todo `data-testid` existente tem de continuar existindo no mesmo papel** (botão, campo, linha). O @craft/ui repassa `data-testid` em `InputEngenharia`; nos componentes que não repassam, envolva com um elemento que carrega o testid ou adicione a prop ao componente do @craft/ui (PR no craft-ui, não cópia local).
2. **Não copiar componente do @craft/ui para dentro da frente** (critério U15). Se faltar algo, a mudança vai para `craft-ui/packages/ui` com página/teste na galeria, e a frente atualiza a dependência.
3. **Respeitar a operação da VPS** (`/root/rea-vps/AGENTS.md`): as 7 frentes têm executores rodando ao mesmo tempo. Trabalhe em **branch própria** (`ui/craft-ui-<etapa>`), nunca na branch em que o executor da frente está; builds pesados entram na fila (máx. 1 pesado por frente, 2 slots globais). Não apague targets de outros.
4. **Uma frente por vez, uma etapa por vez.** Cada etapa termina com testes verdes + build + prints antes/depois. Não comece a próxima com a anterior vermelha.
5. **Comportamento do motor não muda.** A migração é só de tela. Nenhuma chamada ao `api.ts`/Tauri muda de assinatura.
6. **Não alterar `.cargo`, `src-tauri/` nem o motor Rust.**

## 2. Pré-requisitos (fazer uma vez)

- [ ] **Acesso ao craft-ui na VPS.** O repo é privado e de outra conta (`leonardo-creator`). Opções, em ordem de preferência: (a) *deploy key* só-leitura no craft-ui; (b) token fino só-leitura guardado no `~/.git-credentials`/credential helper — **nunca na URL do remote**. Peça ao dono qual usar.
- [ ] Clonar em `/root/rea-vps/vendor/craft-ui` (fora das frentes, compartilhado). Fixar por **tag** (`v0.x.y`) — as frentes apontam para a tag, não para `main`.
- [ ] Em cada frente: `npm i /root/rea-vps/vendor/craft-ui/packages/ui` (ou `"@craft/ui": "file:../../vendor/craft-ui/packages/ui"` com caminho relativo correto). Peers já existentes: react 19, react-dom 19, three 0.187, @react-three/fiber 9, @react-three/drei 10.
- [ ] No CSS de entrada da frente, logo após `@import "tailwindcss";`: `@import "@craft/ui/styles.css";`. Verificar que nada da frente usa as mesmas classes de token (`bg-painel`, `text-texto`…) com outro sentido.
- [ ] Rodar o vitest e o Playwright da frente **antes de tudo** e guardar o placar (`antes.txt`). Esse é o número que não pode piorar.

## 3. Ordem das frentes (do menor risco para o maior)

1. **05 WaterGEMS** — já tem `Ribbon/Docks/Visao3D/InputEngenharia/icones` no formato da "base comum"; gráficos (Curvas, EPS, Perfil, Sparkline) mapeiam 1:1.
2. **07 SewerGEMS** — mesma família da 05 (Bentley); Perfil, Hidrograma, Curvas.
3. **04 Project** — sem 3D; maior ganho em Ribbon (50+ props `onXxx`) e Gantt/PERT/Rede.
4. **06 SAP2000** — Ribbon com guias customizáveis próprias, 40+ `Modal*`, tabelas de resultados, diagramas.
5. **03 QiBuilder** — maior número de componentes (121) e testids (1.963); 3D com R3F.
6. **01 Eberick** — Cad2D próprio grande, croqui; 3D com R3F; DiagramasNVM.
7. **08 CYPE 3D** — **antes**: etapa 08-0 de upgrade (abaixo). Depois: Canvas3D → Viewport3D, CADToolbar/MenuBar → BarraFerramentas/Ribbon.

## 4. Etapas por frente (repetir a receita)

Cada etapa = 1 branch, 1 PR, testes verdes. Use o **Catálogo** da galeria filtrado pela frente para listar os arquivos de cada etapa.

### Etapa A — Base (ícones, campos, tokens)
- Trocar `icones.tsx` local por `Icone` do @craft/ui. Ícone que faltar: **adicionar no craft-ui** (`packages/ui/src/base/icones.tsx`), não local.
- Trocar `InputEngenharia.tsx`/`parseEngenharia.ts`/`CampoEngenharia.tsx` locais pelos do pacote. Atenção: no pacote, Enter dentro de `<form>` deixa o form submeter; Esc sem edição sobe para o diálogo. Conferir os testes que dependem do comportamento antigo; se algum spec assume o antigo, ajuste **o spec com justificativa no PR** (o novo é o critério U04/U10).
- Apagar os arquivos locais substituídos. `grep -r "from \"./cad/icones\"\|InputEngenharia\"" src` deve voltar vazio.
- **Aceite:** vitest + Playwright = placar `antes.txt` (ou melhor); prints de 2 diálogos antes/depois.

### Etapa B — Comandos (Ribbon/Toolbar → registro)
- Criar `src/comandos.ts` na frente: **uma lista de `Comando`** (`{ id, rotulo, icone, atalho, categoria, executar, habilitado, ativo, contexto }`) que chama as MESMAS funções que os `onXxx` do Ribbon atual chamavam.
- Trocar `<Ribbon onNovo=… onAbrir=… …50 props>` por `<ProvedorComandos comandos={…}>` + `<Ribbon id="<frente>" guias={…} guiasContextuais={…} contexto={tipoSelecao}>` e/ou `<BarraFerramentas estado={useBarraFerramentas("<frente>", grupos)} />` + `<PaletaComandos />`.
- As guias/grupos do original (FUNCOES.md da frente lista os menus) viram o array `guias`. Mantenha os mesmos rótulos visíveis que os specs procuram.
- `data-testid` dos botões do ribbon antigo: o `BotaoComando` usa `data-comando={id}`. Se os specs usam `data-testid="ribbon-xxx"`, **adicione suporte a `testid` no `Comando`** (craft-ui) e preencha na frente, OU use `id` igual ao sufixo e ajuste o seletor do spec para `[data-comando=…]` (preferível: menos acoplamento).
- Atalhos de teclado que a frente tratava em `useEffect` próprio passam para `Comando.atalho`; remova os listeners duplicados.
- **Aceite:** U01, U02, U03, U09, U13 verificados à mão (roteiro na página "Barra de ferramentas" da galeria) + placar.

### Etapa C — Casca (Docks/Área de trabalho/Status)
- Trocar `Docks.tsx` local por `AreaTrabalho` (esquerda/direita/baixo como `PainelDock[]`), `ArvoreElementos` → `Arvore`, `PropriedadesDock` → `GradePropriedades`, `BarraStatus` local → `BarraStatus`.
- Painéis de domínio (ex.: `PainelEnergia`, `PainelHidrantes`) **continuam na frente**, só passam a ser `conteudo` de um `PainelDock`.
- **Aceite:** U09/U11/U13; redimensionar/recolher docks; placar.

### Etapa D — Diálogos (o grosso: ~129 modais + ~176 telas de domínio)
- Para cada `Modal*`/`*Dialog`/tela com `fixed inset-0`: trocar a moldura por `<Dialogo>` e os pares rótulo/valor por `<Campo>` + `<InputEngenharia>`/`<Selecao>`/`<Alternar>`/`<Segmentado>`, agrupados com `<GrupoCampos>`.
- Validação: a mensagem vai para a prop `erro` do Dialogo (faixa fixa), não para `alert()`/texto solto.
- Diálogos de edição contínua (propriedades, seções, cargas) → `modal={false}` + `id` (lembra posição).
- **Faça em lotes de 10 diálogos por PR**, por ordem de uso (FUNCOES.md/linhas ✓✓✓ primeiro).
- **Aceite por lote:** U04/U10 em 2 diálogos do lote por teclado (Enter/Esc/Tab), placar.

### Etapa E — Tabelas
- Tabelas de resultados/quantitativos/FlexTables → `TabelaDados` (colunas com `unidade`, `tipo: "numero"`, `editavel`, `total`, `destaque`).
- `PlanilhaGantt` (04, 3.076 linhas) é caso especial: usar `TabelaDados` para a grade + `Gantt` para as barras **lado a lado**, mantendo a seleção sincronizada.
- **Aceite:** U12, placar.

### Etapa F — Desenho e gráficos
- `Visao3D`/`Canvas3D` → `Viewport3D` de `@craft/ui/viewport`. Elementos que não são barra (tubo, laje, nó de rede, PV) entram como `children`/camadas — **se o Viewport3D não aceitar, estender o craft-ui** com uma prop de camadas (PR no craft-ui com página na galeria).
- `Cad2D`/`Prancheta`/`EditorRede`/`MalhaSvg` → `Prancheta2D` como base; ferramentas próprias (croqui, offset, cotas da 01) viram camadas/ferramentas extras sobre ela.
- Gráficos (mapa no Catálogo, categoria "Gráfico / diagrama"):

  | Atual | Substituto |
  |---|---|
  | 05 GraficoCurvas, 07 GraficoCurvaModal | `GraficoXY` + `intersecoes()` (ponto de operação) |
  | 05 GraficoEps, 07 HidrogramaModal | `GraficoXY` (estilo `degrau`, `eixo: "dir"` para fator) |
  | 05 GraficoPerfil, 07 PerfilLongitudinal | `PerfilLongitudinal` |
  | 01 DiagramasNVM (+ diagramas 06/08) | `DiagramaBarra` (N, V, M; M no lado tracionado) |
  | 04 Gantt + PlanilhaGantt | `Gantt` (+ `TabelaDados`) — o motor continua dono do CPM; `caminhoCritico()` só p/ exibição quando o motor não mandar |
  | 04 DiagramaRede, Pert; 03 Unifilar/UnifilarEditavel | `DiagramaNos` (camadas automáticas ou posições livres) |
  | 05 Sparkline | `Sparkline` |
  | 07 CanvasRede, 03 Isometrico | `Prancheta2D` + camadas (planta) / `DiagramaNos` (esquema) |
  | 04 Kanban | **sem base ainda** — ver §6 |
- **Os números continuam vindo do motor** (Rust/Tauri). O gráfico só desenha. Não recalcule nada em TS que o motor já calcula.
- **Aceite:** U05–U08, U16; prints antes/depois de cada gráfico; placar.

### Etapa G — Limpeza (U15)
- `grep -rlE "Ribbon.tsx|Docks.tsx|Visao3D.tsx|InputEngenharia.tsx|icones.tsx|parseEngenharia.ts" src` → vazio.
- Remover CSS morto da frente que só servia aos componentes antigos.
- **Aceite final da frente:** placar ≥ `antes.txt`, build Tauri ok (via fila), os 16 critérios conferidos pelo roteiro da galeria, prints antes/depois anexados ao PR.

## 5. Etapa 08-0 — Upgrade da frente 08 (antes da migração dela)
- React 18 → 19, Tailwind 3 → 4 (`@tailwindcss/vite`, remover `tailwind.config.js`/PostCSS, converter `@tailwind` para `@import "tailwindcss"`), Vite 5 → 7, @vitejs/plugin-react → 5, TypeScript ~5.9.
- Rodar Playwright inteiro da 08 antes e depois; diferença de layout por mudança de defaults do TW4 (bordas/anel/cores) corrige-se no CSS, não nos specs.
- Só depois executar as etapas A–G na 08.

## 6. Lacunas conhecidas do @craft/ui (fazer no craft-ui quando a frente precisar)
- **Kanban** (04): colunas com cartões arrastáveis — criar `QuadroKanban` com página na galeria.
- **Camadas extras no Viewport3D** (tubos, lajes, nós de rede) e **seleção por janela** (retângulo) no 2D/3D.
- **Ferramentas além de "barra"** no 3D (laje por polígono, tubo com diâmetro, cópia/array).
- **Virtualização** na TabelaDados para > 5.000 linhas.
- **Teste de componente** (vitest + Testing Library) para Dialogo/BarraFerramentas/TabelaDados — hoje só há testes das funções puras (37).
- Regra para lacunas: implementar no `packages/ui`, criar/estender a página na galeria, adicionar teste, subir tag nova, e só então usar na frente.

## 7. Como provar cada critério (roteiro rápido)
Os roteiros "Testar:" de cada critério estão na página Início da galeria e em `docs/CRITERIOS.md`. Para automatizar na frente, cada critério vira 1 spec Playwright `e2e/craft-ui/UXX.spec.ts` (ex.: U02 = `Ctrl+K`, digitar, Enter, comando executado). Fazer esses specs na Etapa G de cada frente.

## 8. Entregáveis por PR
- Descrição: etapa, frente, lista de arquivos substituídos/apagados, placar antes/depois (vitest e Playwright), prints antes/depois, critérios conferidos.
- Nenhum arquivo de `src-tauri/`, motor ou `.cargo` no diff (`git diff --stat` conferido).

## 9. O que NÃO fazer
- Não reescrever lógica de engenharia, não "aproveitar para refatorar" o motor.
- Não apagar/renomear `data-testid`.
- Não copiar o código do @craft/ui para a frente.
- Não migrar duas frentes no mesmo PR.
- Não commitar na branch do executor ativo da frente; não forçar push.
- Não colocar token/credencial em URL de remote, `.env` versionado ou log.
