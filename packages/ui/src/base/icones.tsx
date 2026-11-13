/**
 * Ícones de traço único (24×24, stroke = currentColor). Um conjunto só para
 * as 7 frentes — antes cada frente tinha o seu `icones.tsx` (135 a 447 linhas).
 * Para adicionar: inclua o path aqui; o nome vira tipo (`NomeIcone`).
 */
import type { SVGProps } from "react";

export const ICONES = {
  selecionar: "M5 3l6 16 2-7 7-2z",
  desfazer: "M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-4",
  refazer: "M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h4",
  barra: "M4 20L20 4M4 20m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M20 4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  pilar: "M12 3v18M8 21h8M8 3h8",
  viga: "M3 12h18M3 9v6M21 9v6",
  laje: "M3 9l9-5 9 5-9 5zM3 9v4l9 5 9-5V9",
  no: "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 3v4M12 17v4M3 12h4M17 12h4",
  tubo: "M3 9h12a3 3 0 0 1 3 3v9M3 15h9v6",
  copiar: "M8 8h12v12H8zM4 16V4h12",
  mover: "M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3",
  espelhar: "M12 3v18M9 7L4 12l5 5zM15 7l5 5-5 5z",
  girar: "M20 12a8 8 0 1 1-3-6.2M20 4v5h-5",
  apagar: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  cota: "M4 18h16M4 15v6M20 15v6M4 9l8-5 8 5",
  grade: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18",
  guias: "M12 2v20M2 12h20M5 5l14 14",
  calcular: "M5 3h14v18H5zM8 7h8M8 12h2M12 12h2M8 16h2M12 16h2M16 12v4",
  secao: "M4 4h16v4h-6v12h-4V8H4z",
  carga: "M12 3v14M7 12l5 5 5-5M4 21h16",
  apoio: "M12 4v8M6 18l6-6 6 6zM4 21h16",
  dividir: "M3 12h18M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5",
  travar: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  abrir: "M3 6h6l2 2h10v11H3z",
  salvar: "M5 3h11l3 3v15H5zM8 3v5h8V3M8 21v-7h8v7",
  novo: "M6 3h9l4 4v14H6zM14 3v5h5M12 11v6M9 14h6",
  exportar: "M12 15V3M7 8l5-5 5 5M4 15v6h16v-6",
  imprimir: "M6 9V3h12v6M6 18H4v-8h16v8h-2M8 14h8v7H8z",
  buscar: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M21 21l-5-5",
  config: "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M19 12l2-1-1-3-2 .5-1.5-1.5.5-2-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8l-1 3 2 1v0l-2 1 1 3 2-.5 1.5 1.5-.5 2 3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3z",
  camadas: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  vista3d: "M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5",
  planta: "M3 3h18v18H3zM3 12h9V3M12 12v9",
  zoomTudo: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  mais: "M5 12h.01M12 12h.01M19 12h.01",
  fechar: "M6 6l12 12M18 6L6 18",
  seta: "M9 6l6 6-6 6",
  setaBaixo: "M6 9l6 6 6-6",
  alfinete: "M9 3h6l-1 6 4 4H6l4-4zM12 13v8",
  ajuda: "M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01",
  alerta: "M12 3l10 18H2zM12 10v5M12 18h.01",
  info: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 11v6M12 7.5h.01",
  ok: "M5 12l5 5 9-10",
  arrastar: "M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01",
  pessoa: "M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8M4 21a8 8 0 0 1 16 0",
  calendario: "M4 5h16v16H4zM4 10h16M9 3v4M15 3v4",
  tabela: "M3 4h18v16H3zM3 9h18M3 14h18M9 4v16",
  grafico: "M4 20V4M4 20h16M8 16l4-5 3 3 5-7",
  agua: "M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z",
  eletrica: "M13 2L4 14h7l-1 8 9-12h-7z",
} as const;

export type NomeIcone = keyof typeof ICONES;

export interface IconeProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  nome: NomeIcone;
  tamanho?: number;
}

export function Icone({ nome, tamanho = 18, ...resto }: IconeProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      <path d={ICONES[nome]} />
    </svg>
  );
}
