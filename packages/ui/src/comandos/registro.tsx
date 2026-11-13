/**
 * Registro de comandos — a peça que tira o "engessado".
 *
 * Antes: cada Ribbon recebia um callback por botão (a da frente 04 tem 50+
 * props `onXxx`), então mudar a barra = mudar código. Agora o app registra
 * COMANDOS uma vez (id, rótulo, ícone, atalho, executar) e todas as
 * superfícies — barra de ferramentas, ribbon, paleta Ctrl+K, menu de contexto
 * e atalhos de teclado — só referenciam ids. Layout vira dado (persistível,
 * personalizável pelo usuário).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { NomeIcone } from "../base/icones";

export interface Comando {
  id: string;
  rotulo: string;
  icone?: NomeIcone;
  /** Ex.: "Ctrl+Z", "Shift+B", "Del", "F5", "B". */
  atalho?: string;
  /** Texto do tooltip / linha da paleta. */
  descricao?: string;
  /** Categoria na paleta e na biblioteca de personalização. */
  categoria?: string;
  executar: () => void;
  habilitado?: boolean;
  /** Estado ligado (ferramenta ativa, grade visível...). */
  ativo?: boolean;
  /** Tipos de seleção em que o comando é contextual (ex.: ["barra", "no"]). */
  contexto?: string[];
}

interface Ctx {
  comandos: Map<string, Comando>;
  executar: (id: string) => void;
  paletaAberta: boolean;
  abrirPaleta: (aberta: boolean) => void;
  recentes: string[];
}

const Contexto = createContext<Ctx | null>(null);

const CHAVE_RECENTES = "craft-ui:comandos:recentes";

export function lerArmazenado<T>(chave: string, padrao: T): T {
  try {
    const t = localStorage.getItem(chave);
    return t ? (JSON.parse(t) as T) : padrao;
  } catch {
    return padrao;
  }
}
export function gravarArmazenado(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* armazenamento indisponível: preferência só vale na sessão */
  }
}

/** "Ctrl+Shift+Z" casa com o evento? */
export function casaAtalho(atalho: string, e: KeyboardEvent): boolean {
  const partes = atalho.toLowerCase().split("+").map((p) => p.trim());
  const tecla = partes[partes.length - 1];
  const quer = new Set(partes.slice(0, -1));
  if (quer.has("ctrl") !== (e.ctrlKey || e.metaKey)) return false;
  if (quer.has("shift") !== e.shiftKey) return false;
  if (quer.has("alt") !== e.altKey) return false;
  const k = e.key.toLowerCase();
  const nomes: Record<string, string> = { del: "delete", esc: "escape", espaço: " ", space: " " };
  return k === (nomes[tecla] ?? tecla);
}

function digitando(alvo: EventTarget | null) {
  const el = alvo as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

export function ProvedorComandos({ comandos, children }: { comandos: Comando[]; children: ReactNode }) {
  const mapa = useMemo(() => new Map(comandos.map((c) => [c.id, c])), [comandos]);
  const ref = useRef(mapa);
  ref.current = mapa;
  const [paletaAberta, abrirPaleta] = useState(false);
  const [recentes, setRecentes] = useState<string[]>(() => lerArmazenado(CHAVE_RECENTES, []));

  const executar = useCallback((id: string) => {
    const c = ref.current.get(id);
    if (!c || c.habilitado === false) return;
    c.executar();
    setRecentes((r) => {
      const n = [id, ...r.filter((x) => x !== id)].slice(0, 8);
      gravarArmazenado(CHAVE_RECENTES, n);
      return n;
    });
  }, []);

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        abrirPaleta((a) => !a);
        return;
      }
      const semModificador = !e.ctrlKey && !e.metaKey && !e.altKey;
      if (digitando(e.target) && (semModificador || e.key === "Delete")) return;
      for (const c of ref.current.values()) {
        if (c.atalho && casaAtalho(c.atalho, e)) {
          e.preventDefault();
          executar(c.id);
          return;
        }
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [executar]);

  const valor = useMemo(
    () => ({ comandos: mapa, executar, paletaAberta, abrirPaleta, recentes }),
    [mapa, executar, paletaAberta, recentes],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Igual a useComandos, mas devolve null fora de <ProvedorComandos> (para quem também aceita itens soltos). */
export function useComandosOpcional(): Ctx | null {
  return useContext(Contexto);
}

export function useComandos(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error("@craft/ui: use <ProvedorComandos> em volta da barra/ribbon/paleta.");
  return c;
}
