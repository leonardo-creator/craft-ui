/**
 * Perfil longitudinal de rede (05 GraficoPerfil, 07 PerfilLongitudinal):
 * terreno, geratriz inferior/superior do tubo, linha d'água / piezométrica,
 * poços de visita (PV) com cota e profundidade. Montado sobre o GraficoXY
 * (mira, zoom, legenda e eixos de graça) + camada própria dos PVs.
 */
import { formatarNumero } from "./escalas";
import { GraficoXY, type Serie } from "./GraficoXY";

export interface NoPerfil {
  nome: string;
  /** Distância acumulada (m). */
  x: number;
  cotaTerreno: number;
  /** Cota da geratriz inferior (fundo do tubo). */
  cotaFundo: number;
}

export function PerfilLongitudinal({
  nos,
  diametro,
  linhaAgua,
  piezometrica,
  altura = 340,
}: {
  nos: NoPerfil[];
  /** Diâmetro do tubo (m) — desenha a geratriz superior. */
  diametro?: number;
  /** Cota da lâmina d'água ao longo do perfil. */
  linhaAgua?: [number, number][];
  /** Linha piezométrica (redes pressurizadas). */
  piezometrica?: [number, number][];
  altura?: number;
}) {
  const xs = nos.map((n) => n.x);
  const folga = (Math.max(...xs) - Math.min(...xs)) * 0.05 || 1;
  const series: Serie[] = [
    { id: "terreno", nome: "Terreno", pontos: nos.map((n) => [n.x, n.cotaTerreno]), cor: "#92400e", unidade: "m" },
    { id: "gi", nome: "Geratriz inferior", pontos: nos.map((n) => [n.x, n.cotaFundo]), cor: "#4b5563", unidade: "m" },
  ];
  if (diametro) series.push({ id: "gs", nome: `Geratriz superior (DN ${Math.round(diametro * 1000)})`, pontos: nos.map((n) => [n.x, n.cotaFundo + diametro]), cor: "#9ca3af", unidade: "m" });
  if (linhaAgua) series.push({ id: "na", nome: "Lâmina d'água", pontos: linhaAgua, cor: "#0891b2", estilo: "area", unidade: "m" });
  if (piezometrica) series.push({ id: "piezo", nome: "Piezométrica", pontos: piezometrica, cor: "#2563eb", estilo: "tracejada", unidade: "m" });

  return (
    <GraficoXY
      series={series}
      dominioX={[Math.min(...xs) - folga, Math.max(...xs) + folga]}
      tituloX="Distância"
      unidadeX="m"
      tituloY="Cota"
      unidadeY="m"
      altura={altura}
      camadaExtra={({ x, y }) => (
        <g>
          {nos.map((n) => {
            const topo = y(n.cotaTerreno);
            const fundo = y(n.cotaFundo);
            const prof = n.cotaTerreno - n.cotaFundo;
            return (
              <g key={n.nome}>
                <rect x={x(n.x) - 4} y={topo} width={8} height={Math.max(fundo - topo, 1)} fill="var(--cr-painel)" stroke="var(--cr-texto-2)" strokeWidth={1.2} />
                <text x={x(n.x)} y={topo - 18} textAnchor="middle" className="fill-texto text-[10.5px] font-semibold">
                  {n.nome}
                </text>
                <text x={x(n.x)} y={topo - 6} textAnchor="middle" className="fill-texto-3 font-mono text-[9.5px]">
                  h {formatarNumero(prof, 0.01)}
                </text>
              </g>
            );
          })}
        </g>
      )}
    />
  );
}
