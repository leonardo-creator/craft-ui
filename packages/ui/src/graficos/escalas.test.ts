import { describe, expect, it } from "vitest";
import { dominioBonito, escalaLinear, formatarNumero, interpolar, intersecoes, marcas, marcasTempo, nivelTempo, passoBonito } from "./escalas";
import { camadasPert } from "./DiagramaNos";
import { caminhoCritico } from "./Gantt";

describe("escalas", () => {
  it("escala linear e inversa", () => {
    const e = escalaLinear([0, 10], [0, 200]);
    expect(e(5)).toBe(100);
    expect(e.inversa(50)).toBe(2.5);
  });
  it("passo bonito 1-2-2,5-5", () => {
    expect(passoBonito(10, 5)).toBe(2);
    expect(passoBonito(100, 4)).toBe(25);
    expect(passoBonito(0.7, 6)).toBeCloseTo(0.2); // nunca passa de n marcas
    expect(passoBonito(0.7, 10)).toBeCloseTo(0.1);
  });
  it("marcas e domínio arredondado", () => {
    expect(marcas(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(dominioBonito([3.2, 47.9])).toEqual([0, 50]);
    expect(dominioBonito([-12, 30], { incluirZero: true })).toEqual([-20, 30]);
  });
  it("formata pt-BR pelas casas do passo", () => {
    expect(formatarNumero(1234.5, 1)).toBe("1.235");
    expect(formatarNumero(2.5, 0.5)).toBe("2,5");
  });
});

describe("séries", () => {
  const bomba: [number, number][] = [
    [0, 50],
    [20, 45],
    [40, 30],
    [60, 10],
  ];
  const sistema: [number, number][] = [
    [0, 10],
    [20, 15],
    [40, 30],
    [60, 55],
  ];
  it("interpola", () => expect(interpolar(bomba, 10)).toBe(47.5));
  it("ponto de operação = interseção", () => {
    const [p] = intersecoes(bomba, sistema);
    expect(p[0]).toBeCloseTo(40);
    expect(p[1]).toBeCloseTo(30);
  });
});

describe("tempo", () => {
  it("nível pela escala", () => {
    expect(nivelTempo(30)).toBe("dia");
    expect(nivelTempo(8)).toBe("semana");
    expect(nivelTempo(2)).toBe("mes");
  });
  it("marca início de mês", () => {
    const m = marcasTempo("2026-11-12", 0, 60, "mes");
    expect(m.map((x) => x.rotulo)).toEqual(["dez/26", "jan/27"]);
  });
});

describe("diagramas", () => {
  it("camadas PERT por precedência", () => {
    const c = camadasPert(["A", "B", "C", "D"], [
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["C", "D"],
    ]);
    expect(c).toEqual({ A: 0, B: 1, C: 1, D: 2 });
  });
  it("caminho crítico (folga zero)", () => {
    const crit = caminhoCritico([
      { id: "a", inicio: 0, duracao: 5 },
      { id: "b", inicio: 5, duracao: 3, predecessoras: ["a"] },
      { id: "c", inicio: 5, duracao: 1, predecessoras: ["a"] },
      { id: "d", inicio: 8, duracao: 2, predecessoras: ["b", "c"] },
    ]);
    expect([...crit].sort()).toEqual(["a", "b", "d"]);
  });
});
