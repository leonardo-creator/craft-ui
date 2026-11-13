# craft-ui

Biblioteca única de componentes + galeria das 7 frentes REA:
01 Eberick · 03 QiBuilder · 04 Project · 05 WaterGEMS · 06 SAP2000 · 07 SewerGEMS · 08 CYPE 3D.

Hoje cada frente tem sua cópia de `Ribbon.tsx` (6 cópias, 252–1.815 linhas), `Docks.tsx` (5),
`Visao3D.tsx` (5), `InputEngenharia.tsx` (5) e `icones.tsx` (6), todas divergentes. Este repositório
é a versão única e melhorada dessas peças, com **17 critérios de UI/UX testáveis**
([docs/CRITERIOS.md](docs/CRITERIOS.md)). As frentes migram depois, uma por vez.

**Vitrine online:** https://craft-ui-tan.vercel.app (deploy automático a cada push no `main`).

## Rodar a galeria

```bash
npm install
npm run dev        # http://localhost:5190
npm test           # parser, geometria de encaixe, escalas/gráficos (41 testes)
npm run build      # typecheck do pacote + build da galeria
```

## Estrutura

```
packages/ui/              @craft/ui — o que as frentes importam
  src/styles.css          tokens --cr-* (claro/escuro) + @source para o Tailwind 4 do app
  src/base/               Icone, InputEngenharia (+ parseEngenharia), Campo, Botao, Selecao, Alternar, Segmentado
  src/comandos/           registro de comandos, BarraFerramentas, Ribbon, PaletaComandos (Ctrl+K), MenuContexto
  src/dialogo/            Dialogo (modal e não-modal)
  src/docks/              AreaTrabalho (docks), Arvore, GradePropriedades, BarraStatus
  src/tabela/             TabelaDados
  src/viewport/           geometria (encaixe/coordenada), Prancheta2D, Viewport3D, GradeAdaptativa
  src/graficos/           escalas, GraficoXY, DiagramaBarra, PerfilLongitudinal, Gantt, DiagramaNos, Sparkline
apps/galeria/             galeria (Vite) — uma página por componente + catálogo das 450 peças + app de exemplo
docs/CRITERIOS.md         critérios U01–U17
docs/PLANO-GALERIA.md     PARTE 1 — próximo trabalho: versões melhoradas das ~386 telas que faltam, na galeria
docs/PLANO-MIGRACAO.md    PARTE 2 — troca nas frentes (só quando o dono decidir)
```

## Destaques

- **Barra não engessada**: comandos viram dado (`{ id, rotulo, icone, atalho, executar, contexto }`).
  Barra, ribbon, paleta Ctrl+K, menu de contexto e atalhos usam os mesmos ids. A barra encaixa em
  topo/esquerda/direita/flutuante, personaliza por arrastar, mostra comandos da seleção, manda
  o que não cabe para "Mais" e lembra tudo, com "Restaurar padrão".
- **Desenho em qualquer orientação** (pedido do CYPE 3D): plano de trabalho XY/XZ/YZ pelo último nó,
  **guias tracejadas X/Y/Z saindo de cada nó**, encaixe em nó/guia/cruzamento/grade, trava X/Y/Z,
  coordenada digitada (`3`, `@0,0,3`, `4,0,3`, `@2<45`).
- **Grade adaptativa** 2D e 3D: passo 10ⁿ pelo zoom com rótulo, linha principal a cada 10, eixos
  coloridos, esmaece ao longe, sem serrilhado.
- **InputEngenharia** da BASE COMUM A mantido e melhorado (sufixo de unidade, erro em linha, limites,
  ↑/↓). Corrigido: "mês" não vira mais "m" (metro).

- **Gráficos e diagramas** em SVG puro: curvas com ponto de operação, eixo secundário, esforços N/V/M,
  perfil longitudinal com PVs, Gantt com arrastar/duração/caminho crítico, PERT/rede, sparkline.

## Usar numa frente (migração)

Próximo trabalho (outro agente): [docs/PLANO-GALERIA.md](docs/PLANO-GALERIA.md).
Troca nas frentes, quando o dono decidir: [docs/PLANO-MIGRACAO.md](docs/PLANO-MIGRACAO.md).

```bash
git submodule add https://github.com/leonardo-creator/craft-ui vendor/craft-ui   # repo privado: a VPS precisa de token/deploy key
npm i ./vendor/craft-ui/packages/ui
# pnpm também aceita: "@craft/ui": "github:leonardo-creator/craft-ui#path:packages/ui"
```

```css
/* app.css */
@import "tailwindcss";
@import "@craft/ui/styles.css";
```

```tsx
import { ProvedorComandos, BarraFerramentas, useBarraFerramentas, AreaTrabalho, Dialogo, InputEngenharia } from "@craft/ui";
import { Viewport3D } from "@craft/ui/viewport"; // só quem usa 3D (puxa three + R3F)
```

Requisitos: React 19, Tailwind 4, three 0.187, @react-three/fiber 9, @react-three/drei 10.
**A frente 08 (React 18 / Tailwind 3 / Vite 5) precisa subir de versão antes.**

Regra U15: depois de migrar, a frente **não** mantém cópia local de Ribbon/Docks/Visao3D/InputEngenharia/icones.
