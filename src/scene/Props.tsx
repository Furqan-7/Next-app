"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { emitHearts, makeHeartGeometry } from "./fx";
import { boatPose } from "./layout";
import { clamp01, easeInOut, easeOutBack, now, shared, since, type Acted } from "./util";

const PINK = "#e8507f";
const PINK_SOFT = "#f6a9c2";
const WALL = "#f7e4ea";
const GOLD = "#e9c25b";
const WHITE = "#fbf6f4";
const STONE = "#c9c0d6";

type P = { acted: Acted };

/** Runs a callback once each time a moment is played (keyed on its start time). */
function useOnce() {
  const last = useRef<Record<string, number>>({});
  return (key: string, start: number, fn: () => void) => {
    if (last.current[key] === start) return;
    last.current[key] = start;
    fn();
  };
}

/* ---------------- Castle ---------------- */

function Tower({
  x,
  z,
  r,
  h,
  roofH,
  windowMat,
}: {
  x: number;
  z: number;
  r: number;
  h: number;
  roofH: number;
  windowMat: THREE.Material;
}) {
  const flag = useRef<THREE.Mesh>(null!);
  useFrame((st) => {
    if (flag.current) flag.current.rotation.y = Math.sin(st.clock.elapsedTime * 3 + x) * 0.35;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 1.05, h, 24]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      <mesh position={[0, h + 0.12, 0]} castShadow>
        <cylinderGeometry args={[r * 1.18, r * 1.18, 0.35, 24]} />
        <meshStandardMaterial color="#f1d3dd" roughness={0.9} />
      </mesh>
      <mesh position={[0, h + 0.3 + roofH / 2, 0]} castShadow>
        <coneGeometry args={[r * 1.3, roofH, 24]} />
        <meshStandardMaterial color={PINK} roughness={0.7} />
      </mesh>
      <mesh position={[0, h + 0.3 + roofH + 0.4, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshStandardMaterial color={GOLD} />
      </mesh>
      <mesh ref={flag} position={[0, h + 0.3 + roofH + 0.7, 0]}>
        <boxGeometry args={[0.02, 0.3, 0.55]} />
        <meshStandardMaterial color={PINK_SOFT} />
      </mesh>
      {[0.35, 0.62].map((f, i) => (
        <mesh
          key={i}
          position={[0, h * f, r * 0.98]}
          material={windowMat}
        >
          <boxGeometry args={[r * 0.35, r * 0.55, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

export function Castle({ acted, lit }: P & { lit: boolean }) {
  const windowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7c5a8a",
        emissive: new THREE.Color("#ffd27a"),
        emissiveIntensity: 0.05,
      }),
    [],
  );
  const doorGlow = useRef<THREE.PointLight>(null!);
  const once = useOnce();

  useFrame(() => {
    const e = since(acted, "castle");
    const target = lit ? 1 : 0;
    const k = e != null ? clamp01(e / 1.6) : target;
    const v = Math.max(target * (e != null ? k : 1), 0);
    windowMat.emissiveIntensity += (0.05 + v * 1.6 - windowMat.emissiveIntensity) * 0.08;
    windowMat.color.set(v > 0.3 ? "#ffe2a8" : "#7c5a8a");
    if (doorGlow.current) doorGlow.current.intensity = v * 6;
    if (e != null && e > 0.6)
      once("castle", acted.castle!, () => {
        emitHearts([0, 3.5, -8.2], 26, 4, 1.4);
      });
  });

  const crenels = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let x = -3.6; x <= 3.6; x += 0.9) out.push([x, 6.25, -8.55]);
    for (let z = -9.4; z >= -14.2; z -= 0.9) {
      out.push([-3.85, 6.25, z]);
      out.push([3.85, 6.25, z]);
    }
    return out;
  }, []);

  return (
    <group>
      {/* Keep */}
      <mesh position={[0, 3, -11.5]} castShadow receiveShadow>
        <boxGeometry args={[8, 6, 6]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      {crenels.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.45, 0.5, 0.45]} />
          <meshStandardMaterial color="#f1d3dd" roughness={0.9} />
        </mesh>
      ))}
      {/* Door */}
      <group position={[0, 0, -8.46]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1.7, 2.4, 0.1]} />
          <meshStandardMaterial color="#a8456e" roughness={0.7} />
        </mesh>
        <mesh position={[0, 2.4, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.85, 0.85, 0.1, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#a8456e" roughness={0.7} />
        </mesh>
        <mesh position={[0, 2.4, 0.02]}>
          <torusGeometry args={[0.92, 0.07, 8, 24, Math.PI]} />
          <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.4, 0.07]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.3} />
        </mesh>
        <pointLight ref={doorGlow} position={[0, 2, 1]} color="#ffcf8a" intensity={0} distance={8} />
      </group>
      {/* Banners */}
      {[-2.5, 2.5].map((x) => (
        <group key={x} position={[x, 3.4, -8.45]}>
          <mesh>
            <boxGeometry args={[0.75, 1.9, 0.05]} />
            <meshStandardMaterial color={PINK} />
          </mesh>
          <mesh position={[0, 0.25, 0.04]}>
            <circleGeometry args={[0.24, 20]} />
            <meshStandardMaterial color={GOLD} />
          </mesh>
          <mesh position={[0, -0.95, 0]} rotation-z={Math.PI / 4}>
            <boxGeometry args={[0.53, 0.53, 0.05]} />
            <meshStandardMaterial color={PINK} />
          </mesh>
        </group>
      ))}
      {/* Keep windows */}
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 4.6, -8.46]} material={windowMat}>
          <boxGeometry args={[0.5, 0.9, 0.06]} />
        </mesh>
      ))}
      <Tower x={-4.6} z={-8.9} r={1.25} h={7.5} roofH={3.2} windowMat={windowMat} />
      <Tower x={4.6} z={-8.9} r={1.25} h={7.5} roofH={3.2} windowMat={windowMat} />
      <Tower x={-4.4} z={-14.0} r={1.15} h={8.8} roofH={3.4} windowMat={windowMat} />
      <Tower x={4.4} z={-14.0} r={1.15} h={8.8} roofH={3.4} windowMat={windowMat} />
      <Tower x={0} z={-12.6} r={1.7} h={11} roofH={4.6} windowMat={windowMat} />
      <Tower x={-2.1} z={-10.6} r={0.75} h={8.2} roofH={2.4} windowMat={windowMat} />
      <Tower x={2.1} z={-10.6} r={0.75} h={8.2} roofH={2.4} windowMat={windowMat} />
    </group>
  );
}

/* ---------------- Gates ---------------- */

/** One half of the gate. Its hinge is at the group origin; bars extend toward the centre (dir). */
function GateDoor({ dir }: { dir: 1 | -1 }) {
  const bars = [0.2, 0.45, 0.7, 0.95, 1.2, 1.45];
  return (
    <group>
      {bars.map((b) => (
        <mesh key={b} position={[dir * b, 0.95, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.9, 6]} />
          <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {[0.25, 1.75].map((y) => (
        <mesh key={y} position={[dir * 0.78, y, 0]}>
          <boxGeometry args={[1.55, 0.07, 0.07]} />
          <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[dir * 0.78, 1.0, 0.02]}>
        <torusGeometry args={[0.28, 0.04, 8, 20]} />
        <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function Gates({ acted }: P) {
  const l = useRef<THREE.Group>(null!);
  const r = useRef<THREE.Group>(null!);
  const once = useOnce();
  useFrame(() => {
    const e = since(acted, "gates");
    const open = e == null ? 0 : easeInOut(clamp01(e / 1.4));
    if (l.current) l.current.rotation.y = open * 1.75;
    if (r.current) r.current.rotation.y = -open * 1.75;
    if (e != null && e > 0.3)
      once("gates", acted.gates!, () => emitHearts([0, 2.2, 12.5], 22, 2.4, 1.2));
  });
  const fence = useMemo(() => {
    const out: number[] = [];
    for (let x = 2.4; x < 7.5; x += 0.45) out.push(x);
    return out;
  }, []);
  return (
    <group position={[0, 0, 12.5]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.9, 0, 0]}>
          <mesh position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[0.6, 3.2, 0.6]} />
            <meshStandardMaterial color={WHITE} roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.25, 0]} castShadow>
            <boxGeometry args={[0.75, 0.15, 0.75]} />
            <meshStandardMaterial color="#f0d6df" />
          </mesh>
          <mesh position={[0, 3.75, 0]} castShadow>
            <coneGeometry args={[0.5, 0.9, 4]} />
            <meshStandardMaterial color={PINK} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.05, 0]}>
        <torusGeometry args={[1.9, 0.09, 10, 32, Math.PI]} />
        <meshStandardMaterial color={GOLD} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 3.55, 0.05]}>
        <boxGeometry args={[1.5, 0.45, 0.08]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <HeartBadge position={[0, 3.55, 0.12]} scale={0.7} />
      <group ref={l} position={[-1.6, 0, 0]}>
        <GateDoor dir={1} />
      </group>
      <group ref={r} position={[1.6, 0, 0]}>
        <GateDoor dir={-1} />
      </group>
      {[-1, 1].map((s) =>
        fence.map((x) => (
          <mesh key={`${s}${x}`} position={[s * x, 0.45, 0]} castShadow>
            <boxGeometry args={[0.14, 0.9, 0.08]} />
            <meshStandardMaterial color={WHITE} />
          </mesh>
        )),
      )}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 4.95, 0.6, 0]}>
          <boxGeometry args={[5.2, 0.08, 0.06]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
      ))}
    </group>
  );
}

function HeartBadge(props: { position: [number, number, number]; scale?: number }) {
  const geo = useMemo(() => makeHeartGeometry(4), []);
  return (
    <mesh geometry={geo} position={props.position} scale={(props.scale ?? 1) * 1.4}>
      <meshStandardMaterial color={PINK} roughness={0.5} />
    </mesh>
  );
}

/* ---------------- Rose garden ---------------- */

const BUSHES: [number, number, number][] = [
  [-7.6, 7.6, 0.6],
  [-8.3, 8.9, 0.5],
  [-6.9, 6.5, 0.55],
  [-7.7, 10.1, 0.5],
  [-8.8, 6.4, 0.45],
  [-9.1, 10.0, 0.45],
];

export function RoseGarden({ acted }: P) {
  const once = useOnce();
  useFrame(() => {
    const e = since(acted, "roses");
    if (e != null && e > 0.4)
      once("roses", acted.roses!, () => emitHearts([-7.4, 1.2, 8.2], 16, 1.2));
  });
  return (
    <group>
      {BUSHES.map(([x, z, r], i) => (
        <group key={i} position={[x, r * 0.8, z]}>
          <mesh castShadow>
            <sphereGeometry args={[r, 14, 12]} />
            <meshStandardMaterial color="#3f8f45" roughness={0.9} />
          </mesh>
          {Array.from({ length: 7 }).map((_, j) => {
            const a = j * 2.4 + i;
            const y = Math.sin(j * 1.3) * 0.5;
            const rr = Math.sqrt(1 - y * y) * r;
            return (
              <mesh key={j} position={[Math.cos(a) * rr, y * r, Math.sin(a) * rr]}>
                <sphereGeometry args={[0.11, 8, 8]} />
                <meshStandardMaterial color={j % 3 === 0 ? "#ff8fb1" : "#e0284f"} roughness={0.6} />
              </mesh>
            );
          })}
        </group>
      ))}
      {/* Rose arch */}
      <group position={[-6.2, 0, 6.0]} rotation-y={0.5}>
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[1.3, 0.14, 8, 28, Math.PI]} />
          <meshStandardMaterial color="#3f8f45" />
        </mesh>
        {Array.from({ length: 9 }).map((_, j) => {
          const a = (j / 8) * Math.PI;
          return (
            <mesh key={j} position={[Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.12]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial color={j % 2 ? "#ff8fb1" : "#e0284f"} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/* ---------------- Tea party ---------------- */

export function TeaParty({ acted }: P) {
  const pot = useRef<THREE.Group>(null!);
  const once = useOnce();
  useFrame(() => {
    const e = since(acted, "tea");
    let tilt = 0;
    if (e != null && e < 2.2) {
      const up = clamp01(e / 0.5);
      const down = clamp01((e - 1.5) / 0.6);
      tilt = easeInOut(up) * (1 - easeInOut(down));
    }
    if (pot.current) pot.current.rotation.z = -tilt * 0.9;
    if (e != null && e > 0.7)
      once("tea", acted.tea!, () => emitHearts([-10.6, 1.2, 1.6], 12, 0.4, 0.8));
  });
  return (
    <group position={[-11, 0, 1.5]}>
      {/* Umbrella */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.8, 6]} />
        <meshStandardMaterial color="#8a6a58" />
      </mesh>
      <mesh position={[0, 2.85, 0]} castShadow>
        <coneGeometry args={[1.9, 0.7, 12, 1, true]} />
        <meshStandardMaterial color="#f8d7e1" side={THREE.DoubleSide} />
      </mesh>
      {/* Table */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.85, 0.07, 28]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.07, 0.25, 0.8, 10]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      {/* Chairs */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.2, 0, 0]} rotation-y={s * Math.PI / 2}>
          <mesh position={[0, 0.48, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.08, 18]} />
            <meshStandardMaterial color={PINK_SOFT} />
          </mesh>
          <mesh position={[0, 0.85, 0.3]} castShadow>
            <boxGeometry args={[0.6, 0.7, 0.06]} />
            <meshStandardMaterial color={PINK_SOFT} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.48, 6]} />
            <meshStandardMaterial color={GOLD} />
          </mesh>
        </group>
      ))}
      {/* Cups */}
      {[-0.4, 0.4].map((x) => (
        <group key={x} position={[x, 0.86, 0.3]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.07, 0.12, 12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.02, 14]} />
            <meshStandardMaterial color={PINK_SOFT} />
          </mesh>
        </group>
      ))}
      {/* Cupcakes */}
      {[
        [0.15, -0.35],
        [-0.25, -0.3],
      ].map(([x, z]) => (
        <group key={x} position={[x, 0.9, z]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.08, 0.12, 10]} />
            <meshStandardMaterial color="#c58a5c" />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.11, 10, 8]} />
            <meshStandardMaterial color="#ffc2d6" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial color="#e0284f" />
          </mesh>
        </group>
      ))}
      {/* Teapot (pivot at its base) */}
      <group ref={pot} position={[0.05, 0.84, 0]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={PINK} />
        </mesh>
        <mesh position={[0.25, 0.22, 0]} rotation-z={-0.9}>
          <cylinderGeometry args={[0.025, 0.05, 0.25, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.22, 0.2, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.09, 0.025, 6, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------- Dragon ---------------- */

export function Dragon({ acted }: P) {
  const root = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const wingL = useRef<THREE.Mesh>(null!);
  const wingR = useRef<THREE.Mesh>(null!);
  const eyesOpen = useRef<THREE.Group>(null!);
  const eyesShut = useRef<THREE.Group>(null!);
  const once = useOnce();
  const wingGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0.9, 0.55);
    s.quadraticCurveTo(0.75, 0.15, 0.95, -0.05);
    s.quadraticCurveTo(0.55, 0.05, 0.6, -0.3);
    s.quadraticCurveTo(0.3, -0.1, 0, -0.15);
    return new THREE.ShapeGeometry(s);
  }, []);

  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const e = since(acted, "dragon");
    const w = e == null ? 0 : easeOutBack(clamp01(e / 1.1));
    if (root.current) {
      root.current.position.y = w * 0.15 + Math.sin(t * (w > 0.5 ? 3 : 1.2)) * 0.04;
      root.current.rotation.y = 0.55 + w * 0.35;
      const breathe = 1 + Math.sin(t * 1.2) * 0.03 * (1 - w);
      root.current.scale.set(1, breathe, 1);
    }
    if (head.current) {
      head.current.position.y = -0.4 * (1 - w);
      head.current.rotation.x = 0.35 * (1 - w) + (w > 0.9 ? Math.sin(t * 2.4) * 0.08 : 0);
    }
    const flap = w > 0.2 ? Math.sin(t * 9) * 0.5 * w : 0;
    if (wingL.current) wingL.current.rotation.y = -0.4 - flap;
    if (wingR.current) wingR.current.rotation.y = Math.PI + 0.4 + flap;
    if (eyesOpen.current) eyesOpen.current.scale.y = Math.max(0.01, clamp01(w));
    if (eyesShut.current) eyesShut.current.visible = w < 0.3;
    if (e != null && e > 0.8)
      once("dragon", acted.dragon!, () => emitHearts([-9, 2.2, -6.2], 18, 1.4, 1.1));
  });

  const green = "#86d3b0";
  return (
    <group position={[-9, 0, -6.5]}>
      <mesh position={[0, 0.12, 0]} scale={[1.6, 0.25, 1.4]} receiveShadow>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#8a84a0" roughness={1} />
      </mesh>
      <group ref={root}>
        <mesh position={[0, 0.75, 0]} scale={[1, 0.85, 1.15]} castShadow>
          <sphereGeometry args={[0.8, 20, 16]} />
          <meshStandardMaterial color={green} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.65, 0.42]} scale={[0.8, 0.8, 0.6]}>
          <sphereGeometry args={[0.6, 16, 12]} />
          <meshStandardMaterial color="#eef6cf" roughness={0.8} />
        </mesh>
        {[-0.5, -0.1, 0.3].map((z, i) => (
          <mesh key={i} position={[0, 1.45 - i * 0.05, z - 0.3]} rotation-x={-0.4}>
            <coneGeometry args={[0.1, 0.25, 6]} />
            <meshStandardMaterial color="#b49ae0" />
          </mesh>
        ))}
        <mesh position={[0, 0.55, -1.15]} rotation-x={-Math.PI / 2 - 0.3}>
          <coneGeometry args={[0.28, 1.0, 10]} />
          <meshStandardMaterial color={green} roughness={0.7} />
        </mesh>
        <mesh ref={wingL} geometry={wingGeo} position={[0.45, 1.1, -0.1]} rotation-y={-0.4}>
          <meshStandardMaterial color="#b49ae0" side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={wingR} geometry={wingGeo} position={[-0.45, 1.1, -0.1]} rotation-y={Math.PI + 0.4}>
          <meshStandardMaterial color="#b49ae0" side={THREE.DoubleSide} />
        </mesh>
        <group ref={head} position={[0, 0, 0]}>
          <group position={[0, 1.35, 0.7]}>
            <mesh castShadow>
              <sphereGeometry args={[0.55, 20, 16]} />
              <meshStandardMaterial color={green} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.12, 0.42]} scale={[1, 0.7, 0.8]}>
              <sphereGeometry args={[0.3, 14, 10]} />
              <meshStandardMaterial color="#a8e3c6" roughness={0.7} />
            </mesh>
            {[-0.1, 0.1].map((x) => (
              <mesh key={x} position={[x, -0.08, 0.66]}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshStandardMaterial color="#3a5b4c" />
              </mesh>
            ))}
            {[-0.25, 0.25].map((x) => (
              <mesh key={x} position={[x, 0.45, -0.05]} rotation-z={-x * 1.2}>
                <coneGeometry args={[0.07, 0.3, 8]} />
                <meshStandardMaterial color="#fff2c4" />
              </mesh>
            ))}
            {[-0.3, 0.3].map((x) => (
              <mesh key={x} position={[x * 1.1, -0.18, 0.4]} rotation-y={x > 0 ? 0.5 : -0.5}>
                <circleGeometry args={[0.08, 12]} />
                <meshBasicMaterial color="#ffb3c9" />
              </mesh>
            ))}
            <group ref={eyesOpen}>
              {[-0.2, 0.2].map((x) => (
                <group key={x} position={[x, 0.08, 0.47]}>
                  <mesh>
                    <sphereGeometry args={[0.1, 12, 10]} />
                    <meshStandardMaterial color="#ffffff" />
                  </mesh>
                  <mesh position={[0, 0, 0.07]}>
                    <sphereGeometry args={[0.055, 10, 8]} />
                    <meshStandardMaterial color="#222233" />
                  </mesh>
                </group>
              ))}
            </group>
            <group ref={eyesShut}>
              {[-0.2, 0.2].map((x) => (
                <mesh key={x} position={[x, 0.08, 0.52]}>
                  <boxGeometry args={[0.16, 0.025, 0.02]} />
                  <meshStandardMaterial color="#2f3d36" />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ---------------- Wishing well ---------------- */

export function Well({ acted }: P) {
  const coin = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.PointLight>(null!);
  const water = useRef<THREE.MeshStandardMaterial>(null!);
  const once = useOnce();
  const center = new THREE.Vector3(7, 0.7, 8.2);

  useFrame((st) => {
    const e = since(acted, "well");
    const c = coin.current;
    if (c) {
      if (e != null && e < 1.0) {
        const k = clamp01(e / 1.0);
        const from = shared.princess;
        c.visible = true;
        c.position.set(
          THREE.MathUtils.lerp(from.x, center.x, k),
          THREE.MathUtils.lerp(from.y + 1.1, center.y, k) + Math.sin(k * Math.PI) * 1.6,
          THREE.MathUtils.lerp(from.z, center.z, k),
        );
        c.rotation.x = st.clock.elapsedTime * 14;
      } else c.visible = false;
    }
    const g = e == null ? 0 : e < 1 ? 0 : Math.max(0, 1 - (e - 1) / 2.5);
    if (glow.current) glow.current.intensity = g * 10;
    if (water.current) water.current.emissiveIntensity = 0.15 + g * 1.5;
    if (e != null && e > 1.0)
      once("well", acted.well!, () => emitHearts([7, 1.0, 8.2], 20, 0.6, 1.1));
  });

  return (
    <group>
      <group position={[7, 0, 8.2]}>
        {[0.25, 0.6].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2} castShadow>
            <torusGeometry args={[0.85, 0.24, 10, 24]} />
            <meshStandardMaterial color={STONE} roughness={1} />
          </mesh>
        ))}
        <mesh position={[0, 0.55, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.7, 24]} />
          <meshStandardMaterial ref={water} color="#5aa6c9" emissive="#bfe9ff" emissiveIntensity={0.15} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.85, 1.2, 0]} castShadow>
            <boxGeometry args={[0.1, 1.5, 0.1]} />
            <meshStandardMaterial color="#9a7058" />
          </mesh>
        ))}
        <mesh position={[0, 2.15, 0]} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[1.35, 0.7, 4]} />
          <meshStandardMaterial color={PINK} />
        </mesh>
        <mesh position={[0, 1.4, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />
          <meshStandardMaterial color="#9a7058" />
        </mesh>
        <pointLight ref={glow} position={[0, 1, 0]} color="#ffd88a" intensity={0} distance={6} />
      </group>
      <mesh ref={coin} visible={false}>
        <cylinderGeometry args={[0.12, 0.12, 0.03, 16]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb800" emissiveIntensity={0.6} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ---------------- Dock and swan boat ---------------- */

export function Dock() {
  const planks = useMemo(() => {
    const out: number[] = [];
    for (let x = 15.6; x < 21.6; x += 0.42) out.push(x);
    return out;
  }, []);
  return (
    <group>
      {planks.map((x) => (
        <mesh key={x} position={[x, 0.22, 2]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.1, 1.5]} />
          <meshStandardMaterial color="#c49468" roughness={1} />
        </mesh>
      ))}
      {[16.5, 18.5, 20.5].map((x) =>
        [1.3, 2.7].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -0.1, z]}>
            <cylinderGeometry args={[0.09, 0.09, 0.9, 8]} />
            <meshStandardMaterial color="#8a6648" />
          </mesh>
        )),
      )}
    </group>
  );
}

export function SwanBoat({ acted }: P) {
  const g = useRef<THREE.Group>(null!);
  const neckGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.25, 0.55),
      new THREE.Vector3(0, 0.75, 0.85),
      new THREE.Vector3(0, 1.35, 0.7),
      new THREE.Vector3(0, 1.6, 0.95),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.11, 10, false);
  }, []);
  useFrame((st) => {
    const e = since(acted, "swan");
    const p = boatPose(e, st.clock.elapsedTime);
    if (g.current) {
      g.current.position.set(p.x, p.y, p.z);
      g.current.rotation.y = p.yaw;
      g.current.rotation.z = Math.sin(st.clock.elapsedTime * 1.5) * 0.03;
    }
    if (e != null && e > 1 && e < 6.4 && Math.random() < 0.04) {
      emitHearts([p.x, p.y + 1.2, p.z], 1, 0.4, 0.8);
    }
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.1, 0]} scale={[0.85, 0.42, 1.25]} castShadow>
        <sphereGeometry args={[1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation-x={Math.PI}>
        <sphereGeometry args={[0.86, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.16, -0.1]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.7, 20]} />
        <meshStandardMaterial color={PINK_SOFT} />
      </mesh>
      <mesh geometry={neckGeo} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.62, 0.95]}>
        <sphereGeometry args={[0.18, 14, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.58, 1.18]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.07, 0.22, 8]} />
        <meshStandardMaterial color="#ffae42" />
      </mesh>
      {[-0.09, 0.09].map((x) => (
        <mesh key={x} position={[x * 1.5, 1.68, 1.05]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.7, 0.35, -0.25]} rotation-z={s * 0.5} scale={[0.2, 0.45, 0.8]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#fff7fb" />
        </mesh>
      ))}
      <mesh position={[0, 0.55, -0.95]} rotation-x={0.5}>
        <coneGeometry args={[0.3, 0.6, 10]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

/* ---------------- Easel ---------------- */

function makePortrait() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 0, 320);
  bg.addColorStop(0, "#ffe3ee");
  bg.addColorStop(1, "#ffd0b8");
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 320);
  // shoulders and dress
  g.fillStyle = "#f29bbd";
  g.beginPath();
  g.ellipse(128, 330, 95, 110, 0, 0, Math.PI * 2);
  g.fill();
  // hair (back)
  g.fillStyle = "#3b2420";
  g.beginPath();
  g.ellipse(128, 160, 72, 88, 0, 0, Math.PI * 2);
  g.fill();
  // face
  g.fillStyle = "#f8d9c6";
  g.beginPath();
  g.arc(128, 150, 56, 0, Math.PI * 2);
  g.fill();
  // fringe
  g.fillStyle = "#3b2420";
  g.beginPath();
  g.ellipse(128, 108, 62, 30, 0, Math.PI, Math.PI * 2);
  g.fill();
  // eyes, blush, smile
  g.fillStyle = "#2b1d1a";
  [104, 152].forEach((x) => {
    g.beginPath();
    g.arc(x, 152, 6, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = "rgba(255,120,150,0.5)";
  [96, 160].forEach((x) => {
    g.beginPath();
    g.ellipse(x, 172, 11, 7, 0, 0, Math.PI * 2);
    g.fill();
  });
  g.strokeStyle = "#a33a5a";
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.arc(128, 172, 12, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  // crown
  g.fillStyle = "#f2c14e";
  g.beginPath();
  g.moveTo(92, 92);
  g.lineTo(100, 58);
  g.lineTo(114, 80);
  g.lineTo(128, 50);
  g.lineTo(142, 80);
  g.lineTo(156, 58);
  g.lineTo(164, 92);
  g.closePath();
  g.fill();
  // hearts
  const heart = (x: number, y: number, s: number) => {
    g.fillStyle = "#ff5c8a";
    g.beginPath();
    g.moveTo(x, y + s * 0.3);
    g.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    g.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    g.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    g.fill();
  };
  heart(36, 40, 30);
  heart(214, 70, 24);
  heart(40, 230, 22);
  heart(220, 220, 30);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Easel({ acted }: P) {
  const tex = useMemo(() => makePortrait(), []);
  const paint = useRef<THREE.MeshBasicMaterial>(null!);
  const once = useOnce();
  useFrame(() => {
    const e = since(acted, "easel");
    const k = e == null ? 0 : clamp01((e - 0.3) / 1.8);
    if (paint.current) paint.current.opacity = k;
    if (e != null && e > 2.0)
      once("easel", acted.easel!, () => emitHearts([10.2, 2.2, -5], 14, 1, 0.9));
  });
  return (
    <group position={[10.2, 0, -5]} rotation-y={0.55}>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]} rotation-z={x * 0.25} castShadow>
          <boxGeometry args={[0.07, 2.3, 0.07]} />
          <meshStandardMaterial color="#9a7058" />
        </mesh>
      ))}
      <mesh position={[0, 1.0, -0.45]} rotation-x={0.35}>
        <boxGeometry args={[0.07, 2.1, 0.07]} />
        <meshStandardMaterial color="#9a7058" />
      </mesh>
      <mesh position={[0, 0.72, 0.08]}>
        <boxGeometry args={[1.1, 0.07, 0.15]} />
        <meshStandardMaterial color="#9a7058" />
      </mesh>
      <mesh position={[0, 1.55, 0.05]} castShadow>
        <boxGeometry args={[1.25, 1.55, 0.06]} />
        <meshStandardMaterial color={GOLD} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.55, 0.085]}>
        <planeGeometry args={[1.1, 1.4]} />
        <meshStandardMaterial color="#fffaf2" />
      </mesh>
      <mesh position={[0, 1.55, 0.09]}>
        <planeGeometry args={[1.1, 1.4]} />
        <meshBasicMaterial ref={paint} map={tex} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------------- Gazebo ---------------- */

export function Gazebo({ acted }: P) {
  const last = useRef(0);
  useFrame(() => {
    const e = since(acted, "gazebo");
    if (e != null && e > 0.8 && e < 4.5 && now() - last.current > 0.3) {
      last.current = now();
      emitHearts([shared.princess.x * 0.5 + shared.prince.x * 0.5, 1.9, shared.princess.z], 3, 0.6, 0.9);
    }
  });
  const pillars = useMemo(
    () => Array.from({ length: 6 }).map((_, i) => (i / 6) * Math.PI * 2 + Math.PI / 6),
    [],
  );
  return (
    <group position={[4.8, 0, 1.8]}>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.3, 2.4, 0.3, 6]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      {pillars.map((a) => (
        <mesh key={a} position={[Math.cos(a) * 2, 1.55, Math.sin(a) * 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 2.5, 10]} />
          <meshStandardMaterial color={WHITE} />
        </mesh>
      ))}
      <mesh position={[0, 2.85, 0]}>
        <cylinderGeometry args={[2.35, 2.35, 0.15, 6]} />
        <meshStandardMaterial color={GOLD} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <coneGeometry args={[2.8, 1.4, 6]} />
        <meshStandardMaterial color={PINK} />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <sphereGeometry args={[0.18, 12, 10]} />
        <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ---------------- Throne ---------------- */

export function Throne() {
  return (
    <group position={[0, 0, -6.0]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.6, 0.4, 32]} />
        <meshStandardMaterial color={WHITE} />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.03, 32]} />
        <meshStandardMaterial color={PINK_SOFT} />
      </mesh>
      <group position={[0, 0.4, -0.75]}>
        <mesh position={[0, 0.35, 0.2]} castShadow>
          <boxGeometry args={[1.0, 0.25, 0.8]} />
          <meshStandardMaterial color={PINK} />
        </mesh>
        <mesh position={[0, 0.25, 0.2]}>
          <boxGeometry args={[1.1, 0.5, 0.85]} />
          <meshStandardMaterial color={GOLD} />
        </mesh>
        <mesh position={[0, 1.1, -0.15]} castShadow>
          <boxGeometry args={[1.05, 1.7, 0.15]} />
          <meshStandardMaterial color={GOLD} />
        </mesh>
        <mesh position={[0, 1.1, -0.06]}>
          <boxGeometry args={[0.8, 1.4, 0.05]} />
          <meshStandardMaterial color={PINK} />
        </mesh>
        <HeartBadge position={[0, 2.15, -0.15]} scale={0.9} />
      </group>
    </group>
  );
}
