import { afterEach, describe, expect, it, vi } from "vitest";
import { avisar, fecharAviso, lerAvisos, limparAvisos } from "./Avisos";

afterEach(() => {
  limparAvisos();
  vi.useRealTimers();
});

describe("avisar", () => {
  it("não empilha mensagem repetida", () => {
    const a = avisar("Salvo", { tipo: "sucesso" });
    const b = avisar("Salvo", { tipo: "sucesso" });
    expect(a).toBe(b);
    expect(lerAvisos()).toHaveLength(1);
  });
  it("mantém no máximo 4", () => {
    for (let i = 0; i < 6; i++) avisar(`m${i}`);
    expect(lerAvisos().map((a) => a.texto)).toEqual(["m2", "m3", "m4", "m5"]);
  });
  it("erro dura mais que info", () => {
    vi.useFakeTimers();
    avisar("info");
    avisar("falhou", { tipo: "erro" });
    vi.advanceTimersByTime(4000);
    expect(lerAvisos().map((a) => a.texto)).toEqual(["falhou"]);
    vi.advanceTimersByTime(3500);
    expect(lerAvisos()).toHaveLength(0);
  });
  it("fecharAviso remove", () => {
    const id = avisar("x");
    fecharAviso(id);
    expect(lerAvisos()).toHaveLength(0);
  });
});
