/**
 * Avisos (toast) — retorno de ação que não interrompe o trabalho.
 * Regra (U17): erro de gravação NUNCA é silencioso; ação reversível oferece
 * "Desfazer" em vez de pedir confirmação.
 *
 * Store de módulo (sem Provider): qualquer função chama `avisar(...)` e o
 * <Avisos /> montado uma vez na raiz do app renderiza.
 *  - erro fica 7 s e pode ser fechado; info/sucesso 3,5 s (6 s com ação);
 *  - mensagens iguais seguidas não empilham; no máximo 4 na tela;
 *  - role="alert" para erro, "status" para o resto (leitor de tela).
 */
import { useSyncExternalStore } from "react";
import { Icone, type NomeIcone } from "./icones";

export type TipoAviso = "info" | "sucesso" | "erro";
export interface Aviso {
  id: number;
  tipo: TipoAviso;
  texto: string;
  acao?: { rotulo: string; executar: () => void };
}

let lista: Aviso[] = [];
let seq = 0;
const ouvintes = new Set<() => void>();
const emitir = () => ouvintes.forEach((f) => f());

export function fecharAviso(id: number) {
  lista = lista.filter((a) => a.id !== id);
  emitir();
}

export function avisar(texto: string, opts: { tipo?: TipoAviso; acao?: Aviso["acao"]; duracaoMs?: number } = {}): number {
  const tipo = opts.tipo ?? "info";
  const repetido = lista.find((a) => a.texto === texto && a.tipo === tipo);
  if (repetido) return repetido.id;
  const id = ++seq;
  lista = [...lista.slice(-3), { id, tipo, texto, acao: opts.acao }];
  emitir();
  const ms = opts.duracaoMs ?? (tipo === "erro" ? 7000 : opts.acao ? 6000 : 3500);
  setTimeout(() => fecharAviso(id), ms);
  return id;
}

/** Só para testes: zera a fila. */
export function limparAvisos() {
  lista = [];
  emitir();
}
export const lerAvisos = () => lista;

const assinar = (f: () => void) => {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
};
const vazio: Aviso[] = [];

const BORDA: Record<TipoAviso, string> = {
  info: "border-linha-forte",
  sucesso: "border-sucesso/50",
  erro: "border-erro/60 bg-erro-suave",
};
const ICONE: Record<TipoAviso, NomeIcone> = { info: "info", sucesso: "ok", erro: "alerta" };
const COR: Record<TipoAviso, string> = { info: "text-acento", sucesso: "text-sucesso", erro: "text-erro" };

export function Avisos() {
  const itens = useSyncExternalStore(assinar, lerAvisos, () => vazio);
  if (!itens.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[95] flex w-[min(440px,calc(100vw-24px))] -translate-x-1/2 flex-col items-center gap-2">
      {itens.map((a) => (
        <div
          key={a.id}
          role={a.tipo === "erro" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full items-center gap-2.5 border bg-painel px-3 py-2 text-[12px] text-texto shadow-flutuante ${BORDA[a.tipo]}`}
        >
          <Icone nome={ICONE[a.tipo]} tamanho={15} className={COR[a.tipo]} />
          <span className="min-w-0 flex-1">{a.texto}</span>
          {a.acao && (
            <button
              type="button"
              className="shrink-0 font-semibold text-acento hover:underline"
              onClick={() => {
                a.acao!.executar();
                fecharAviso(a.id);
              }}
            >
              {a.acao.rotulo}
            </button>
          )}
          <button type="button" aria-label="Fechar aviso" className="flex h-5 w-5 shrink-0 items-center justify-center text-texto-3 hover:text-texto" onClick={() => fecharAviso(a.id)}>
            <Icone nome="fechar" tamanho={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
