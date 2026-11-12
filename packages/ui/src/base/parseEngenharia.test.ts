import { describe, expect, it } from "vitest";
import { parseEngenharia } from "./parseEngenharia";

describe("parseEngenharia — Base Comum A", () => {
  it("aceita decimal pt-BR com vírgula", () => {
    expect(parseEngenharia("2,5")).toEqual({ ok: true, valor: 2.5 });
  });

  it("aceita milhar com ponto e decimal com vírgula", () => {
    expect(parseEngenharia("1.234,5")).toEqual({ ok: true, valor: 1234.5 });
  });

  it("aceita decimal com ponto (en-US)", () => {
    expect(parseEngenharia("1.5")).toEqual({ ok: true, valor: 1.5 });
  });

  it("resolve fração simples", () => {
    expect(parseEngenharia("10/2")).toEqual({ ok: true, valor: 5 });
  });

  it("aceita unidade colada (cm)", () => {
    expect(parseEngenharia("15cm")).toEqual({ ok: true, valor: 15, unidade: "cm" });
  });

  it("aceita unidade com espaço (mm)", () => {
    expect(parseEngenharia("150 mm")).toEqual({ ok: true, valor: 150, unidade: "mm" });
  });

  it("aceita dias (d)", () => {
    expect(parseEngenharia("5d")).toEqual({ ok: true, valor: 5, unidade: "d" });
  });

  it("aceita vazão (L/s)", () => {
    expect(parseEngenharia("30 L/s")).toEqual({ ok: true, valor: 30, unidade: "L/s" });
  });

  it("aceita negativo com força (kN)", () => {
    expect(parseEngenharia("-10 kN")).toEqual({ ok: true, valor: -10, unidade: "kN" });
  });

  it("recusa vazio com erro amigável", () => {
    const r = parseEngenharia("   ");
    expect(r.ok).toBe(false);
    expect(r.erro).toContain("Digite");
  });

  it("recusa letras sem número com erro amigável", () => {
    const r = parseEngenharia("abc");
    expect(r.ok).toBe(false);
    expect(r.erro).toBeTruthy();
  });

  it("recusa unidade desconhecida citando a unidade", () => {
    const r = parseEngenharia("5xyz");
    expect(r.ok).toBe(false);
    expect(r.erro).toContain("xyz");
  });

  it("recusa divisão por zero", () => {
    const r = parseEngenharia("10/0");
    expect(r.ok).toBe(false);
    expect(r.erro).toContain("zero");
  });
});

describe("parseEngenharia — correções @craft/ui", () => {
  it("mês não colide com metro", () => {
    expect(parseEngenharia("2 meses")).toEqual({ ok: true, valor: 2, unidade: "mês" });
    expect(parseEngenharia("3m")).toEqual({ ok: true, valor: 3, unidade: "m" });
  });
});
