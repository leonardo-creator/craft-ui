import type { Vec3 } from "./geometria";

/** Modelo mínimo de nós + barras usado pelos editores 2D/3D da galeria. */
export interface ModeloBarras {
  nos: Vec3[];
  barras: [number, number][];
}

export const PORTICO_EXEMPLO: ModeloBarras = {
  nos: [
    [0, 0, 0],
    [0, 0, 3],
    [5, 0, 0],
    [5, 0, 3],
  ],
  barras: [
    [0, 1],
    [2, 3],
    [1, 3],
    [0, 3],
  ],
};
