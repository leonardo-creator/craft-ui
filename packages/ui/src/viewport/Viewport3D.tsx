/**
 * Vista 3D com desenho de barras em qualquer orientação (pedido do CYPE 3D:
 * barra em pé, deitada, inclinada). Substitui `Visao3D.tsx` (5 cópias,
 * 191–1058 linhas) e o `Canvas3D` da 08.
 *  - Z para cima (convenção de engenharia), cubo de vistas clicável;
 *  - grade adaptativa no PLANO DE TRABALHO (XY / XZ / YZ);
 *  - plano de trabalho passa pelo último nó → pilar no XZ, viga no XY,
 *    diagonal no XZ/YZ com dois cliques;
 *  - cada nó solta guias tracejadas X/Y/Z; a guia seguida acende;
 *  - encaixe: nó □, cruzamento ✕, guia ┼, grade ·;
 *  - teclas X/Y/Z travam eixo; digitar abre "@dx,dy,dz";
 *  - cor por orientação (em pé / deitada / inclinada) opcional.
 */
import { GizmoHelper, GizmoViewcube, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { EntradaCoordenada, teclaIniciaCoordenada, useVistaAtiva } from "./EntradaCoordenada";
import { GradeAdaptativa, type PlanoTrabalho } from "./GradeAdaptativa";
import { encaixar, formatarPasso, lerCoordenada, orientacao, passoAdaptativo, type Eixo, type Encaixe, type Vec3 } from "./geometria";
import type { ModeloBarras } from "./modelo";


const EIXOS_PLANO: Record<PlanoTrabalho, Eixo[]> = { XY: [0, 1], XZ: [0, 2], YZ: [1, 2] };
const NORMAL: Record<PlanoTrabalho, Eixo> = { XY: 2, XZ: 1, YZ: 0 };

export interface Viewport3DProps {
  modelo: ModeloBarras;
  onChange?: (m: ModeloBarras) => void;
  ferramenta?: "selecionar" | "barra";
  plano?: PlanoTrabalho;
  trava?: Eixo | null;
  onTrava?: (e: Eixo | null) => void;
  guias?: boolean;
  /** Pinta por orientação: azul em pé, verde deitada, laranja inclinada. */
  corPorOrientacao?: boolean;
  selecionada?: number | null;
  onSelecionar?: (i: number | null) => void;
  onCursor?: (info: { ponto: Vec3; delta: Vec3 | null; tipo: Encaixe["tipo"]; passo: number }) => void;
  tema?: "claro" | "escuro";
}

const CORES_ORIENT = { "em-pe": "#2563eb", deitada: "#16a34a", inclinada: "#ea580c" };

export function Viewport3D(props: Viewport3DProps) {
  const [digitando, setDigitando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [passo, setPasso] = useState(1);
  const ponte = useRef<{ aplicar: (t: string) => string | null; cancelar: () => void } | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const { trava, onTrava, ferramenta = "barra" } = props;
  const ativa = useVistaAtiva(caixa);

  useEffect(() => {
    function k(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      if (!ativa.current) return;
      const t = e.key.toLowerCase();
      if (t === "x" || t === "y" || t === "z") {
        const ix = (t === "x" ? 0 : t === "y" ? 1 : 2) as Eixo;
        onTrava?.(trava === ix ? null : ix);
      } else if (e.key === "Escape") {
        ponte.current?.cancelar();
        onTrava?.(null);
      } else if (ferramenta === "barra" && teclaIniciaCoordenada(e)) {
        e.preventDefault();
        setErro(null);
        setDigitando(e.key);
      }
    }
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [trava, onTrava, ferramenta]);

  return (
    <div ref={caixa} className="relative h-full w-full" onContextMenu={(e) => e.preventDefault()}>
      <Canvas camera={{ position: [12, -16, 10], fov: 40, up: [0, 0, 1], near: 0.01, far: 5000 }} dpr={[1, 2]}>
        <color attach="background" args={[props.tema === "escuro" ? "#0d131d" : "#fafafa"]} />
        <hemisphereLight args={["#ffffff", "#9ca3af", 2.2]} />
        <directionalLight position={[10, -8, 20]} intensity={1.2} />
        <OrbitControls makeDefault enableDamping target={[2.5, 0, 1.5]} mouseButtons={{ LEFT: undefined as unknown as THREE.MOUSE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE }} />
        <Cena {...props} ponte={ponte} onPasso={setPasso} />
        <GizmoHelper alignment="top-right" margin={[64, 64]}>
          <GizmoViewcube faces={["Direita", "Esquerda", "Fundos", "Frente", "Topo", "Base"]} color={props.tema === "escuro" ? "#1f2937" : "#f3f4f6"} textColor={props.tema === "escuro" ? "#e5e7eb" : "#111827"} strokeColor="#9ca3af" />
        </GizmoHelper>
      </Canvas>
      <div className="pointer-events-none absolute left-2 top-2 flex gap-1 font-mono text-[11px]">
        <span className="border border-linha bg-painel px-1.5 text-texto-2">plano {props.plano ?? "XY"}</span>
        <span className="border border-linha bg-painel px-1.5 text-texto-2">grade {formatarPasso(passo)}</span>
        {trava != null && <span className="bg-acento px-1.5 text-white">trava {"XYZ"[trava]}</span>}
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 text-[10px] text-texto-3">
        Esquerdo: desenhar · Direito: girar · Meio: mover · Roda: zoom · X/Y/Z: travar · digite para coordenada
      </div>
      <EntradaCoordenada
        aberta={digitando != null}
        textoInicial={digitando ?? ""}
        erro={erro}
        dica="3 (na direção do cursor) · @0,0,3 · 4,0,3 · @2<45"
        onFechar={() => setDigitando(null)}
        onAplicar={(t) => {
          const e = ponte.current?.aplicar(t) ?? null;
          if (e) setErro(e);
          else setDigitando(null);
        }}
      />
    </div>
  );
}

function Cena({
  modelo,
  onChange,
  ferramenta = "barra",
  plano = "XY",
  trava = null,
  guias = true,
  corPorOrientacao = true,
  selecionada,
  onSelecionar,
  onCursor,
  ponte,
  onPasso,
  tema,
}: Viewport3DProps & {
  ponte: React.RefObject<{ aplicar: (t: string) => string | null; cancelar: () => void } | null>;
  onPasso: (p: number) => void;
}) {
  const { camera, controls } = useThree();
  const [cursor, setCursor] = useState<Encaixe | null>(null);
  const [inicio, setInicio] = useState<Vec3 | null>(null);
  const normal = NORMAL[plano];
  const livres = EIXOS_PLANO[plano];
  const ancora = inicio ?? modelo.nos[modelo.nos.length - 1] ?? [0, 0, 0];
  const desloc = ancora[normal];

  const planoThree = useMemo(() => {
    const n = new THREE.Vector3();
    n.setComponent(normal, 1);
    return new THREE.Plane(n, -desloc);
  }, [normal, desloc]);

  function passoAtual() {
    const alvo = (controls as unknown as { target?: THREE.Vector3 } | null)?.target ?? new THREE.Vector3();
    return Math.max(passoAdaptativo(camera.position.distanceTo(alvo), 4), 0.1);
  }

  function adicionar(a: Vec3, b: Vec3) {
    if (!onChange || (a[0] === b[0] && a[1] === b[1] && a[2] === b[2])) return;
    const nos = [...modelo.nos];
    const idx = (p: Vec3) => {
      const i = nos.findIndex((n) => Math.abs(n[0] - p[0]) < 1e-9 && Math.abs(n[1] - p[1]) < 1e-9 && Math.abs(n[2] - p[2]) < 1e-9);
      if (i >= 0) return i;
      nos.push(p);
      return nos.length - 1;
    };
    onChange({ nos, barras: [...modelo.barras, [idx(a), idx(b)]] });
    setInicio(b);
  }

  ponte.current = {
    cancelar: () => setInicio(null),
    aplicar: (t) => {
      const base = inicio ?? ancora;
      const dir = inicio && cursor ? ([cursor.ponto[0] - inicio[0], cursor.ponto[1] - inicio[1], cursor.ponto[2] - inicio[2]] as Vec3) : null;
      const r = lerCoordenada(t, base, { plano: livres, direcao: dir });
      if (!r.ok) return r.erro;
      if (!inicio) setInicio(r.ponto);
      else adicionar(inicio, r.ponto);
      return null;
    },
  };

  function encaixe(e: { ray: THREE.Ray }): Encaixe | null {
    const p = new THREE.Vector3();
    if (!e.ray.intersectPlane(planoThree, p)) return null;
    const passo = passoAtual();
    return encaixar([p.x, p.y, p.z], { nos: modelo.nos, passo, tolerancia: passo * 0.45, origem: inicio, trava, plano: livres, guias });
  }

  return (
    <>
      <GradeAdaptativa plano={plano} deslocamento={desloc} onPasso={onPasso} tema={tema} />
      {plano !== "XY" && <GradeAdaptativa plano="XY" opacidade={0.35} tema={tema} />}
      {/* superfície invisível para capturar o ponteiro no plano de trabalho */}
      <mesh
        visible={false}
        position={plano === "XY" ? [0, 0, desloc] : plano === "XZ" ? [0, desloc, 0] : [desloc, 0, 0]}
        rotation={plano === "XY" ? [0, 0, 0] : plano === "XZ" ? [Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0]}
        onPointerMove={(e) => {
          const enc = encaixe(e);
          if (!enc) return;
          setCursor(enc);
          onCursor?.({ ponto: enc.ponto, delta: inicio ? (enc.ponto.map((v, i) => v - inicio[i]) as Vec3) : null, tipo: enc.tipo, passo: passoAtual() });
        }}
        onPointerOut={() => setCursor(null)}
        onClick={(e) => {
          if (e.button !== 0 || e.delta > 4) return;
          if (ferramenta === "selecionar") return onSelecionar?.(null);
          const enc = encaixe(e);
          if (!enc) return;
          if (!inicio) setInicio(enc.ponto);
          else adicionar(inicio, enc.ponto);
        }}
      >
        <planeGeometry args={[20000, 20000]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>

      {guias && modelo.nos.map((n, i) => <GuiasNo key={i} no={n} ativo={cursor?.alinhadoCom.map((x) => x === i) as boolean[] | undefined} />)}

      {modelo.barras.map(([a, b], i) => {
        const A = modelo.nos[a];
        const B = modelo.nos[b];
        const cor = selecionada === i ? "#7c3aed" : corPorOrientacao ? CORES_ORIENT[orientacao(A, B)] : "#64748b";
        return (
          <Barra
            key={i}
            a={A}
            b={B}
            cor={cor}
            onClick={(e) => {
              if (ferramenta !== "selecionar") return;
              e.stopPropagation();
              onSelecionar?.(i);
            }}
          />
        );
      })}
      {modelo.nos.map((n, i) => (
        <mesh key={i} position={n} raycast={() => null}>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshBasicMaterial color="#111827" />
        </mesh>
      ))}

      {ferramenta === "barra" && inicio && cursor && <Line points={[inicio, cursor.ponto]} color="#2563eb" lineWidth={2} dashed dashSize={0.2} gapSize={0.12} />}
      {ferramenta === "barra" && cursor && <Marcador3D enc={cursor} />}
    </>
  );
}

function GuiasNo({ no, ativo }: { no: Vec3; ativo?: boolean[] }) {
  const L = 400;
  const cores = ["#dc2626", "#16a34a", "#2563eb"];
  // guia ao longo do eixo k: acende quando o cursor está alinhado com o nó nos OUTROS dois eixos
  return (
    <>
      {[0, 1, 2].map((k) => {
        const a = [...no] as Vec3;
        const b = [...no] as Vec3;
        a[k] -= L;
        b[k] += L;
        const outros = [0, 1, 2].filter((x) => x !== k);
        const on = !!ativo && outros.every((o) => ativo[o]);
        const parcial = !!ativo && outros.some((o) => ativo[o]);
        return <Line key={k} points={[a, b]} color={cores[k]} lineWidth={on ? 1.6 : 1} dashed dashSize={0.25} gapSize={0.18} transparent opacity={on ? 0.95 : parcial ? 0.45 : 0.18} depthWrite={false} raycast={() => null} />;
      })}
    </>
  );
}

function Barra({ a, b, cor, onClick }: { a: Vec3; b: Vec3; cor: string; onClick: (e: ThreeEvent<MouseEvent>) => void }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    return {
      pos: A.clone().add(B).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()),
      len: d.length(),
    };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} onClick={onClick}>
      <cylinderGeometry args={[0.06, 0.06, len, 10]} />
      <meshStandardMaterial color={cor} />
    </mesh>
  );
}

function Marcador3D({ enc }: { enc: Encaixe }) {
  const cor = "#d97706";
  return (
    <group position={enc.ponto}>
      {enc.tipo === "no" ? (
        <mesh raycast={() => null}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshBasicMaterial color={cor} wireframe />
        </mesh>
      ) : (
        <mesh raycast={() => null}>
          <sphereGeometry args={[enc.tipo === "cruzamento" ? 0.13 : 0.08, 16, 16]} />
          <meshBasicMaterial color={cor} depthTest={false} />
        </mesh>
      )}
    </group>
  );
}
