/**
 * Prancheta 2D — base dos editores em planta/perfil (Cad2D da 01, Prancheta
 * da 01/05, EditorRede da 05, perfis da 07, MalhaSvg da 06). Antes cada
 * frente desenhava sua grade com passo fixo; aqui:
 *  - grade adaptativa: subdivide com o zoom e mostra o passo (1 m → 10 cm);
 *  - eixos X/Y coloridos na origem;
 *  - zoom na posição do mouse (roda), pan com botão do meio / espaço+arrastar;
 *  - nós soltam GUIAS tracejadas (X e Y); cursor gruda em guia e cruzamento;
 *  - marcador de encaixe diz o que pegou: nó □, cruzamento ✕, guia ┼, grade ·;
 *  - trava de eixo (teclas X/Y ou Shift = orto);
 *  - digitar abre a caixa de coordenada (3 / @dx,dy / @d<ang);
 *  - F = enquadrar tudo; Esc cancela a barra em curso.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EntradaCoordenada, teclaIniciaCoordenada, useVistaAtiva } from "./EntradaCoordenada";
import { encaixar, formatarPasso, lerCoordenada, passoAdaptativo, type Eixo, type Encaixe, type Vec3 } from "./geometria";
import type { ModeloBarras } from "./modelo";

export function Prancheta2D({
  modelo,
  onChange,
  ferramenta = "barra",
  selecionada,
  onSelecionar,
  guias = true,
  grade = true,
  onCursor,
}: {
  modelo: ModeloBarras;
  onChange: (m: ModeloBarras) => void;
  ferramenta?: "selecionar" | "barra";
  selecionada?: number | null;
  onSelecionar?: (i: number | null) => void;
  guias?: boolean;
  grade?: boolean;
  /** Para a barra de status: posição, Δ e tipo de encaixe. */
  onCursor?: (info: { ponto: Vec3; delta: Vec3 | null; tipo: Encaixe["tipo"]; passo: number }) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 800, h: 500 });
  const [vista, setVista] = useState({ cx: 4, cy: 2, escala: 50 }); // px por metro
  const [cursor, setCursor] = useState<Encaixe | null>(null);
  const [inicio, setInicio] = useState<Vec3 | null>(null);
  const [trava, setTrava] = useState<Eixo | null>(null);
  const [digitando, setDigitando] = useState<string | null>(null);
  const [erroCoord, setErroCoord] = useState<string | null>(null);
  const pan = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const espaco = useRef(false);
  const caixa = useRef<HTMLDivElement>(null);
  const ativa = useVistaAtiva(caixa);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTam({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const passo = passoAdaptativo(tam.w / vista.escala, 8);
  const paraTela = useCallback((x: number, y: number) => [tam.w / 2 + (x - vista.cx) * vista.escala, tam.h / 2 - (y - vista.cy) * vista.escala] as const, [tam, vista]);
  const paraMundo = useCallback((px: number, py: number): Vec3 => [vista.cx + (px - tam.w / 2) / vista.escala, vista.cy - (py - tam.h / 2) / vista.escala, 0], [tam, vista]);

  const nos2d = modelo.nos;

  function posEvento(e: { clientX: number; clientY: number }) {
    const r = svg.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  }

  function calcularEncaixe(e: { clientX: number; clientY: number; shiftKey?: boolean }) {
    const [px, py] = posEvento(e);
    const bruto = paraMundo(px, py);
    let t = trava;
    if (e.shiftKey && inicio && t == null) t = Math.abs(bruto[0] - inicio[0]) > Math.abs(bruto[1] - inicio[1]) ? 0 : 1;
    return encaixar(bruto, { nos: nos2d, passo, tolerancia: 10 / vista.escala, origem: inicio, trava: t, plano: [0, 1], guias, grade });
  }

  function adicionarBarra(a: Vec3, b: Vec3) {
    if (a[0] === b[0] && a[1] === b[1]) return;
    const nos = [...modelo.nos];
    const idx = (p: Vec3) => {
      const i = nos.findIndex((n) => n[0] === p[0] && n[1] === p[1] && n[2] === p[2]);
      if (i >= 0) return i;
      nos.push(p);
      return nos.length - 1;
    };
    const ia = idx(a);
    const ib = idx(b);
    onChange({ nos, barras: [...modelo.barras, [ia, ib]] });
    setInicio(b);
  }

  function clique(e: React.PointerEvent) {
    if (ferramenta === "selecionar") {
      const alvo = (e.target as Element).closest("[data-barra]");
      onSelecionar?.(alvo ? Number(alvo.getAttribute("data-barra")) : null);
      return;
    }
    const enc = calcularEncaixe(e);
    if (!inicio) setInicio(enc.ponto);
    else adicionarBarra(inicio, enc.ponto);
  }

  // teclado: trava, cancelar, enquadrar, digitar coordenada
  useEffect(() => {
    function k(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      if (!ativa.current) return;
      if (e.key === " ") espaco.current = true;
      const tecla = e.key.toLowerCase();
      if (tecla === "x" || tecla === "y") setTrava((t) => (t === (tecla === "x" ? 0 : 1) ? null : tecla === "x" ? 0 : 1));
      else if (e.key === "Escape") {
        setInicio(null);
        setTrava(null);
      } else if (tecla === "f") enquadrar();
      else if (ferramenta === "barra" && teclaIniciaCoordenada(e)) {
        e.preventDefault();
        setErroCoord(null);
        setDigitando(e.key);
      }
    }
    const solta = (e: KeyboardEvent) => e.key === " " && (espaco.current = false);
    window.addEventListener("keydown", k);
    window.addEventListener("keyup", solta);
    return () => {
      window.removeEventListener("keydown", k);
      window.removeEventListener("keyup", solta);
    };
  });

  function enquadrar() {
    if (!nos2d.length) return;
    const xs = nos2d.map((n) => n[0]);
    const ys = nos2d.map((n) => n[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const escala = Math.min(tam.w / Math.max(x1 - x0, 1), tam.h / Math.max(y1 - y0, 1)) * 0.75;
    setVista({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, escala });
  }

  function aplicarCoordenada(t: string) {
    const base = inicio ?? cursor?.ponto ?? [0, 0, 0];
    const dir = inicio && cursor ? ([cursor.ponto[0] - inicio[0], cursor.ponto[1] - inicio[1], 0] as Vec3) : null;
    const r = lerCoordenada(t, base, { plano: [0, 1], direcao: dir });
    if (!r.ok) return setErroCoord(r.erro);
    setDigitando(null);
    if (!inicio) setInicio(r.ponto);
    else adicionarBarra(inicio, r.ponto);
  }

  // grade adaptativa: linhas finas (passo) e fortes (10×passo)
  const linhasGrade = useMemo(() => {
    if (!grade) return { finas: "", fortes: "" };
    const [x0w, y1w] = paraMundo(0, 0);
    const [x1w, y0w] = paraMundo(tam.w, tam.h);
    let finas = "";
    let fortes = "";
    const p10 = passo * 10;
    for (let x = Math.floor(x0w / passo) * passo; x <= x1w; x += passo) {
      const [sx] = paraTela(x, 0);
      const forte = Math.abs(Math.round(x / p10) * p10 - x) < passo / 2;
      const seg = `M${sx.toFixed(1)} 0V${tam.h}`;
      if (forte) fortes += seg;
      else finas += seg;
    }
    for (let y = Math.floor(y0w / passo) * passo; y <= y1w; y += passo) {
      const [, sy] = paraTela(0, y);
      const forte = Math.abs(Math.round(y / p10) * p10 - y) < passo / 2;
      const seg = `M0 ${sy.toFixed(1)}H${tam.w}`;
      if (forte) fortes += seg;
      else finas += seg;
    }
    return { finas, fortes };
  }, [grade, passo, paraMundo, paraTela, tam]);

  const [ox, oy] = paraTela(0, 0);
  const cur = cursor ? paraTela(cursor.ponto[0], cursor.ponto[1]) : null;
  const ini = inicio ? paraTela(inicio[0], inicio[1]) : null;

  return (
    <div ref={caixa} className="relative h-full w-full select-none" onContextMenu={(e) => e.preventDefault()}>
      <svg
        ref={svg}
        className={`h-full w-full ${ferramenta === "barra" ? "cursor-crosshair" : "cursor-default"}`}
        onWheel={(e) => {
          const [px, py] = posEvento(e);
          const antes = paraMundo(px, py);
          const escala = Math.max(2, Math.min(5000, vista.escala * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
          setVista({ escala, cx: antes[0] - (px - tam.w / 2) / escala, cy: antes[1] + (py - tam.h / 2) / escala });
        }}
        onPointerDown={(e) => {
          if (e.button === 1 || e.button === 2 || espaco.current) {
            pan.current = { x: e.clientX, y: e.clientY, cx: vista.cx, cy: vista.cy };
            (e.target as Element).setPointerCapture(e.pointerId);
          } else if (e.button === 0) clique(e);
        }}
        onPointerMove={(e) => {
          if (pan.current) {
            const p = pan.current;
            setVista((v) => ({ ...v, cx: p.cx - (e.clientX - p.x) / v.escala, cy: p.cy + (e.clientY - p.y) / v.escala }));
            return;
          }
          const enc = calcularEncaixe(e);
          setCursor(enc);
          onCursor?.({ ponto: enc.ponto, delta: inicio ? [enc.ponto[0] - inicio[0], enc.ponto[1] - inicio[1], 0] : null, tipo: enc.tipo, passo });
        }}
        onPointerUp={() => (pan.current = null)}
        onPointerLeave={() => setCursor(null)}
        onDoubleClick={(e) => e.button === 1 && enquadrar()}
      >
        <path d={linhasGrade.finas} stroke="var(--cr-linha)" strokeWidth={1} />
        <path d={linhasGrade.fortes} stroke="var(--cr-linha-forte)" strokeWidth={1} />
        <line x1={0} y1={oy} x2={tam.w} y2={oy} stroke="var(--cr-eixo-x)" strokeWidth={1.2} opacity={0.7} />
        <line x1={ox} y1={0} x2={ox} y2={tam.h} stroke="var(--cr-eixo-y)" strokeWidth={1.2} opacity={0.7} />

        {guias &&
          nos2d.map((n, i) => {
            const [sx, sy] = paraTela(n[0], n[1]);
            const ativaX = cursor && cursor.alinhadoCom[1] === i; // mesma y → guia horizontal
            const ativaY = cursor && cursor.alinhadoCom[0] === i;
            return (
              <g key={`g${i}`} strokeDasharray="5 4" strokeWidth={1}>
                <line x1={0} y1={sy} x2={tam.w} y2={sy} stroke="var(--cr-eixo-x)" opacity={ativaX ? 0.95 : 0.16} />
                <line x1={sx} y1={0} x2={sx} y2={tam.h} stroke="var(--cr-eixo-y)" opacity={ativaY ? 0.95 : 0.16} />
              </g>
            );
          })}

        {modelo.barras.map(([a, b], i) => {
          const [x1, y1] = paraTela(modelo.nos[a][0], modelo.nos[a][1]);
          const [x2, y2] = paraTela(modelo.nos[b][0], modelo.nos[b][1]);
          return (
            <g key={i} data-barra={i} className="cursor-pointer">
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={12} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={selecionada === i ? "var(--cr-contexto)" : "var(--cr-texto-2)"} strokeWidth={selecionada === i ? 4 : 3} />
            </g>
          );
        })}
        {nos2d.map((n, i) => {
          const [sx, sy] = paraTela(n[0], n[1]);
          return <rect key={i} x={sx - 3.5} y={sy - 3.5} width={7} height={7} fill="var(--cr-texto)" />;
        })}

        {ferramenta === "barra" && ini && cur && <line x1={ini[0]} y1={ini[1]} x2={cur[0]} y2={cur[1]} stroke="var(--cr-acento)" strokeWidth={2} strokeDasharray="6 4" />}
        {ferramenta === "barra" && cur && cursor && <MarcadorEncaixe x={cur[0]} y={cur[1]} tipo={cursor.tipo} />}
        {ini && cur && cursor && inicio && (
          <text x={(ini[0] + cur[0]) / 2 + 8} y={(ini[1] + cur[1]) / 2 - 8} className="fill-acento font-mono text-[11px]">
            {Math.hypot(cursor.ponto[0] - inicio[0], cursor.ponto[1] - inicio[1]).toFixed(2)} m
          </text>
        )}
      </svg>

      <div className="pointer-events-none absolute right-2 top-2 flex gap-1 font-mono text-[11px]">
        {trava != null && <span className="bg-acento px-1.5 text-white">trava {trava === 0 ? "X" : "Y"}</span>}
        <span className="border border-linha bg-painel px-1.5 text-texto-2">grade {formatarPasso(passo)}</span>
      </div>
      <EntradaCoordenada
        aberta={digitando != null}
        textoInicial={digitando ?? ""}
        onAplicar={aplicarCoordenada}
        onFechar={() => setDigitando(null)}
        dica="3 (na direção do cursor) · @2,0 · 4,3 · @5<30"
        erro={erroCoord}
      />
    </div>
  );
}

export function MarcadorEncaixe({ x, y, tipo }: { x: number; y: number; tipo: Encaixe["tipo"] }) {
  const cor = "var(--cr-alerta)";
  const rot = { no: "nó", cruzamento: "cruzamento", guia: "guia", grade: "", livre: "" }[tipo];
  return (
    <g pointerEvents="none">
      {tipo === "no" && <rect x={x - 7} y={y - 7} width={14} height={14} fill="none" stroke={cor} strokeWidth={2} />}
      {tipo === "cruzamento" && <path d={`M${x - 7} ${y - 7}L${x + 7} ${y + 7}M${x + 7} ${y - 7}L${x - 7} ${y + 7}`} stroke={cor} strokeWidth={2} />}
      {tipo === "guia" && <path d={`M${x - 8} ${y}H${x + 8}M${x} ${y - 8}V${y + 8}`} stroke={cor} strokeWidth={2} />}
      {(tipo === "grade" || tipo === "livre") && <circle cx={x} cy={y} r={3} fill={cor} />}
      {rot && (
        <text x={x + 10} y={y + 16} className="font-mono text-[10px]" fill={cor}>
          {rot}
        </text>
      )}
    </g>
  );
}
