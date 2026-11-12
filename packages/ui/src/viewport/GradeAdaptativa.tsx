/**
 * Grade 3D adaptativa (R3F). Substitui o `<gridHelper args={[lado, 20]}>` /
 * `new GridHelper(30, 30)` das frentes 03/08:
 *  - passo muda com a distância da câmera (10 m → 1 m → 10 cm), sem serrilhar
 *    (linhas por derivada de tela, `fwidth`);
 *  - linha principal a cada 10 passos mais forte;
 *  - eixos X (vermelho) e Y (verde) na origem;
 *  - esmaece ao longe (sem "chão infinito" poluído);
 *  - no plano de trabalho atual (XY no chão, ou XZ/YZ em pé) quando pedido.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { passoAdaptativo } from "./geometria";

const vert = /* glsl */ `
varying vec3 vW;
void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;

const frag = /* glsl */ `
uniform float uPasso; uniform vec3 uCentro; uniform vec3 uCorFina; uniform vec3 uCorForte;
uniform vec3 uCorA; uniform vec3 uCorB; uniform int uPlano; uniform float uOpacidade;
varying vec3 vW;
vec2 coords(){ if(uPlano==1) return vW.xz; if(uPlano==2) return vW.yz; return vW.xy; }
float linha(vec2 p, float s){ vec2 q=p/s; vec2 g=abs(fract(q-.5)-.5)/fwidth(q); return 1.-min(min(g.x,g.y),1.); }
void main(){
  vec2 p = coords();
  vec2 c = uPlano==1 ? uCentro.xz : (uPlano==2 ? uCentro.yz : uCentro.xy);
  float d = length(p-c);
  float fade = 1.-smoothstep(uPasso*25., uPasso*70., d);
  float fina = linha(p,uPasso), forte = linha(p,uPasso*10.);
  vec3 cor = mix(uCorFina, uCorForte, forte);
  float a = max(fina*.6, forte*.9);
  float ea = 1.-min(abs(p.y)/fwidth(p.y),1.); // eixo ao longo do 1º eixo do plano
  float eb = 1.-min(abs(p.x)/fwidth(p.x),1.);
  cor = mix(cor,uCorA,ea); cor = mix(cor,uCorB,eb);
  a = max(a, max(ea,eb)*.95);
  gl_FragColor = vec4(cor, a*fade*uOpacidade);
  if(gl_FragColor.a < .01) discard;
}`;

function cssVar(nome: string, padrao: string) {
  if (typeof document === "undefined") return padrao;
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || padrao;
}

export type PlanoTrabalho = "XY" | "XZ" | "YZ";

export function GradeAdaptativa({
  plano = "XY",
  deslocamento = 0,
  opacidade = 1,
  onPasso,
  tema,
}: {
  plano?: PlanoTrabalho;
  /** Posição do plano no eixo normal (ex.: plano XZ em y = 5). */
  deslocamento?: number;
  opacidade?: number;
  onPasso?: (passo: number) => void;
  /** Muda as cores (lidas dos tokens --cr-grade-*) quando o tema troca. */
  tema?: string;
}) {
  const { camera, controls } = useThree();
  const ultimo = useRef(0);
  const mat = useMemo(() => {
    const fina = new THREE.Color(cssVar("--cr-grade-fina", "#d1d5db"));
    const forte = new THREE.Color(cssVar("--cr-grade-forte", "#9ca3af"));
    const ex = new THREE.Color(cssVar("--cr-eixo-x", "#dc2626"));
    const ey = new THREE.Color(cssVar("--cr-eixo-y", "#16a34a"));
    const ez = new THREE.Color(cssVar("--cr-eixo-z", "#2563eb"));
    const [a, b] = plano === "XY" ? [ex, ey] : plano === "XZ" ? [ex, ez] : [ey, ez];
    return new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uPasso: { value: 1 },
        uCentro: { value: new THREE.Vector3() },
        uCorFina: { value: fina },
        uCorForte: { value: forte },
        uCorA: { value: a },
        uCorB: { value: b },
        uPlano: { value: plano === "XY" ? 0 : plano === "XZ" ? 1 : 2 },
        uOpacidade: { value: opacidade },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plano, tema]);
  mat.uniforms.uOpacidade.value = opacidade;

  useFrame(() => {
    const alvo = (controls as unknown as { target?: THREE.Vector3 } | null)?.target ?? new THREE.Vector3();
    const d = camera.position.distanceTo(alvo);
    const p = passoAdaptativo(d, 4);
    mat.uniforms.uPasso.value = p;
    mat.uniforms.uCentro.value.copy(alvo);
    if (p !== ultimo.current) {
      ultimo.current = p;
      onPasso?.(p);
    }
  });

  const rot: [number, number, number] = plano === "XY" ? [0, 0, 0] : plano === "XZ" ? [Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0];
  const pos: [number, number, number] = plano === "XY" ? [0, 0, deslocamento] : plano === "XZ" ? [0, deslocamento, 0] : [deslocamento, 0, 0];
  return (
    <mesh rotation={rot} position={pos} material={mat} renderOrder={-1} raycast={() => null}>
      <planeGeometry args={[20000, 20000]} />
    </mesh>
  );
}
