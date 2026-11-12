import { describe, expect, it } from "vitest";
import { encaixar, formatarPasso, lerCoordenada, orientacao, passoAdaptativo, type Vec3 } from "./geometria";

const nos: Vec3[] = [
  [0, 0, 0],
  [5, 0, 3],
];

describe("passoAdaptativo", () => {
  it("cresce em potências de 10 com o zoom", () => {
    expect(passoAdaptativo(40)).toBe(10);
    expect(passoAdaptativo(8)).toBe(1);
    expect(passoAdaptativo(0.8)).toBeCloseTo(0.1);
  });
  it("formata com unidade legível", () => {
    expect(formatarPasso(0.1)).toBe("10 cm");
    expect(formatarPasso(1)).toBe("1 m");
    expect(formatarPasso(0.001)).toBe("1 mm");
  });
});

describe("encaixar", () => {
  it("gruda no nó próximo", () => {
    const e = encaixar([0.1, 0.05, 0], { nos, passo: 1, tolerancia: 0.3 });
    expect(e.tipo).toBe("no");
    expect(e.ponto).toEqual([0, 0, 0]);
  });
  it("gruda na guia de um nó (cursor alinhado em x com o nó 2)", () => {
    const e = encaixar([5.1, 0, 1.4], { nos, passo: 1, tolerancia: 0.3, plano: [0, 2] });
    expect(e.tipo).toBe("guia");
    expect(e.ponto[0]).toBe(5);
    expect(e.ponto[2]).toBe(1); // z caiu na grade
  });
  it("cruzamento: x de um nó e z de outro", () => {
    const e = encaixar([0.08, 0, 2.95], { nos, passo: 1, tolerancia: 0.3, plano: [0, 2] });
    expect(e.tipo).toBe("cruzamento");
    expect(e.ponto).toEqual([0, 0, 3]);
    expect(e.alinhadoCom).toEqual([0, -1, 1]);
  });
  it("trava de eixo: só z varia a partir da origem", () => {
    const e = encaixar([2.3, 1.7, 2.6], { nos, passo: 1, tolerancia: 0.3, origem: [1, 1, 0], trava: 2 });
    expect(e.ponto).toEqual([1, 1, 3]);
  });
});

describe("lerCoordenada", () => {
  const u: Vec3 = [1, 2, 0];
  it("relativo 3D", () => expect(lerCoordenada("@0,0,3", u)).toEqual({ ok: true, ponto: [1, 2, 3] }));
  it("absoluto 3D", () => expect(lerCoordenada("4,0,3", u)).toEqual({ ok: true, ponto: [4, 0, 3] }));
  it("vírgula decimal com ;", () => expect(lerCoordenada("@0;0;2,5", u)).toEqual({ ok: true, ponto: [1, 2, 2.5] }));
  it("polar no plano XZ", () => {
    const r = lerCoordenada("@2<90", u, { plano: [0, 2] });
    expect(r.ok && r.ponto.map((v) => Math.round(v * 1e6) / 1e6)).toEqual([1, 2, 2]);
  });
  it("distância na direção do cursor", () => expect(lerCoordenada("3", u, { direcao: [0, 0, 1] })).toEqual({ ok: true, ponto: [1, 2, 3] }));
  it("erro claro", () => expect(lerCoordenada("abc", u).ok).toBe(false));
});

describe("orientacao", () => {
  it("pilar / viga / diagonal", () => {
    expect(orientacao([0, 0, 0], [0, 0, 3])).toBe("em-pe");
    expect(orientacao([0, 0, 3], [5, 0, 3])).toBe("deitada");
    expect(orientacao([0, 0, 0], [5, 0, 3])).toBe("inclinada");
  });
});
