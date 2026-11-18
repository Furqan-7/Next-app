"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { beachRadius, BEACH_WIDTH, ISLAND_RADIUS, plateauRadius, WATER_Y } from "./layout";
import { distanceToPath, NODES, SEGMENTS, type XZ } from "./paths";

/* ---------- Sky, fog and light, with a day → dusk blend for the finale ---------- */

const DAY = { top: "#b9b2ea", mid: "#ecc9e2", horizon: "#ffe1d4", fog: "#f7dfe2" };
const DUSK = { top: "#1d1a4a", mid: "#5b3f86", horizon: "#e88aa6", fog: "#6a4f86" };

export function Atmosphere({ dusk }: { dusk: boolean }) {
  const { scene } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const k = useRef(0);
  const fogDay = useMemo(() => new THREE.Color(DAY.fog), []);
  const fogDusk = useMemo(() => new THREE.Color(DUSK.fog), []);

  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uDusk: { value: 0 },
          dTop: { value: new THREE.Color(DAY.top) },
          dMid: { value: new THREE.Color(DAY.mid) },
          dHor: { value: new THREE.Color(DAY.horizon) },
          nTop: { value: new THREE.Color(DUSK.top) },
          nMid: { value: new THREE.Color(DUSK.mid) },
          nHor: { value: new THREE.Color(DUSK.horizon) },
        },
        vertexShader: /* glsl */ `
          varying vec3 vP;
          void main() {
            vP = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uDusk;
          uniform vec3 dTop, dMid, dHor, nTop, nMid, nHor;
          varying vec3 vP;
          void main() {
            vec3 top = mix(dTop, nTop, uDusk);
            vec3 mid = mix(dMid, nMid, uDusk);
            vec3 hor = mix(dHor, nHor, uDusk);
            float h = vP.y;
            vec3 c = h < 0.0 ? hor : (h < 0.22 ? mix(hor, mid, h / 0.22) : mix(mid, top, smoothstep(0.22, 0.9, h)));
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );

  useFrame((_, dt) => {
    k.current += ((dusk ? 1 : 0) - k.current) * Math.min(1, dt * 0.8);
    const d = k.current;
    skyMat.uniforms.uDusk.value = d;
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(fogDay).lerp(fogDusk, d);
    if (sun.current) sun.current.intensity = 2.1 - d * 1.4;
    if (hemi.current) hemi.current.intensity = 0.95 - d * 0.45;
  });

  return (
    <>
      <fog attach="fog" args={[DAY.fog, 70, 260]} />
      <mesh material={skyMat} renderOrder={-1}>
        <sphereGeometry args={[450, 32, 16]} />
      </mesh>
      <hemisphereLight ref={hemi} args={["#fff0f6", "#86b06e", 0.95]} />
      <directionalLight
        ref={sun}
        position={[18, 30, 14]}
        intensity={2.1}
        color="#fff3e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
      {/* Soft studio-style reflections, built from a few light panels (no files to download). */}
      <Environment resolution={128} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={2.2} color="#fff1f6" position={[0, 6, -9]} scale={[14, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffe2cc" position={[10, 3, 6]} rotation-y={-Math.PI / 2.5} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#d9d2ff" position={[-10, 3, 4]} rotation-y={Math.PI / 2.5} scale={[10, 4, 1]} />
        <Lightformer form="circle" intensity={3} color="#ffffff" position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={5} />
      </Environment>
    </>
  );
}

/* ---------- Water ---------- */

export function Water() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDeep: { value: new THREE.Color("#5ea9c4") },
          uShallow: { value: new THREE.Color("#9fdfd6") },
          uFoam: { value: new THREE.Color("#ffffff") },
          uFog: { value: new THREE.Color(DAY.fog) },
          uR: { value: ISLAND_RADIUS + BEACH_WIDTH },
        },
        vertexShader: /* glsl */ `
          varying vec3 vW;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uR;
          uniform vec3 uDeep, uShallow, uFoam, uFog;
          varying vec3 vW;
          void main() {
            float r = length(vW.xz);
            float a = atan(vW.z, vW.x);
            // Same curve as beachRadius() in layout.ts.
            float rb = uR + 0.9 * sin(3.0 * a + 2.0) + 0.5 * sin(5.0 * a + 0.7);
            float off = r - rb;
            vec3 c = mix(uShallow, uDeep, smoothstep(0.0, 12.0, off));
            float w = sin(vW.x * 0.7 + uTime * 1.1) * sin(vW.z * 0.6 - uTime * 0.8);
            w += 0.5 * sin(vW.x * 1.9 - uTime * 1.7 + vW.z * 1.3);
            c += w * 0.02;
            float ring = smoothstep(0.85, 1.0, sin((off - uTime * 0.45) * 2.4));
            c = mix(c, uFoam, ring * smoothstep(4.5, 0.6, off) * 0.5);
            c = mix(c, uFoam, smoothstep(0.9, 0.0, off) * 0.85);
            float glint = pow(max(0.0, sin(vW.x * 3.1 + uTime * 2.0) * sin(vW.z * 2.7 - uTime * 1.6)), 24.0);
            c += glint * 0.35;
            float d = length(vW - cameraPosition);
            c = mix(c, uFog, smoothstep(60.0, 300.0, d));
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const { scene } = useThree();
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    if (scene.fog) mat.uniforms.uFog.value.copy((scene.fog as THREE.Fog).color);
  });
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position-y={WATER_Y}>
      <planeGeometry args={[700, 700, 1, 1]} />
    </mesh>
  );
}

/* ---------- Island ---------- */

function islandShape(radius: (a: number) => number, inset = 0) {
  const shape = new THREE.Shape();
  const n = 160;
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = radius(a) - inset;
    // Shape y is world -z, because the shape is laid flat with rotateX(-90°).
    const x = Math.cos(a) * r;
    const y = -Math.sin(a) * r;
    if (k === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

function slab(radius: (a: number) => number, depth: number, bevel: number, inset = 0) {
  const g = new THREE.ExtrudeGeometry(islandShape(radius, inset), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  });
  g.rotateX(-Math.PI / 2);
  return g;
}

export function Island() {
  const plateau = useMemo(() => slab(plateauRadius, 0.55, 0.14), []);
  const beach = useMemo(() => slab(beachRadius, 0.5, 0.12), []);
  const seabed = useMemo(() => slab((a) => beachRadius(a) + 3, 0.2, 0.0), []);
  return (
    <group>
      {/* Grass plateau: top face sits at y = 0 */}
      <mesh geometry={plateau} position-y={-0.69} receiveShadow castShadow>
        <meshStandardMaterial attach="material-0" color="#86c25c" roughness={1} />
        <meshStandardMaterial attach="material-1" color="#a99272" roughness={1} />
      </mesh>
      {/* Beach */}
      <mesh geometry={beach} position-y={-0.78} receiveShadow>
        <meshStandardMaterial attach="material-0" color="#f1dfc4" roughness={1} />
        <meshStandardMaterial attach="material-1" color="#e3cba9" roughness={1} />
      </mesh>
      <mesh geometry={seabed} position-y={-1.3}>
        <meshStandardMaterial color="#e9d9bd" roughness={1} />
      </mesh>
      {/* Footpaths linking every stop, and the plaza */}
      <Paths />
      <mesh position={[0, 0.014, -5.2]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[3.4, 48]} />
        <meshStandardMaterial color="#e6ddd4" roughness={1} />
      </mesh>
      {PATH_STONES.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.03, z]} rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[r, 10]} />
          <meshStandardMaterial color="#cbbfb4" roughness={1} />
        </mesh>
      ))}
      <Rocks />
      <LilyPads />
      <Lamps />
      <Hedges />
    </group>
  );
}

/* ---------- Beach rocks, lily pads, lamps, hedges ---------- */

function Rocks() {
  const rocks = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number]; r: number }[] = [];
    const angles = [0.9, 1.25, 2.2, 2.55, 3.3, 3.75, 4.3, 4.6, 5.2, 5.65, 6.0, 1.75];
    angles.forEach((a, i) => {
      const inWater = i % 3 === 0;
      const r = inWater ? beachRadius(a) + 0.9 + (i % 2) * 0.8 : (plateauRadius(a) + beachRadius(a)) / 2 + ((i * 37) % 10) / 20;
      const sz = 0.35 + ((i * 53) % 10) / 22;
      out.push({
        p: [Math.cos(a) * r, inWater ? WATER_Y + 0.05 : -0.2, Math.sin(a) * r],
        s: [sz * 1.3, sz * 0.8, sz],
        r: i * 1.7,
      });
    });
    return out;
  }, []);
  return (
    <group>
      {rocks.map((k, i) => (
        <mesh key={i} position={k.p} scale={k.s} rotation={[0.2, k.r, 0.1]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#aaa3ad" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function LilyPads() {
  const pads = useMemo(() => {
    const out: { x: number; z: number; s: number; rot: number; flower: boolean }[] = [];
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; out.length < 26 && k < 200; k++) {
      const a = rnd() * Math.PI * 2;
      // Keep clear of the dock and the swan boat's lap.
      if (a > 5.9 || a < 0.75) continue;
      const r = beachRadius(a) + 1.2 + rnd() * 5;
      const cx = Math.cos(a) * r;
      const cz = Math.sin(a) * r;
      const cluster = 1 + Math.floor(rnd() * 3);
      for (let c = 0; c < cluster; c++) {
        out.push({
          x: cx + (rnd() - 0.5) * 1.4,
          z: cz + (rnd() - 0.5) * 1.4,
          s: 0.3 + rnd() * 0.25,
          rot: rnd() * Math.PI * 2,
          flower: rnd() < 0.25,
        });
      }
    }
    return out;
  }, []);
  return (
    <group position-y={WATER_Y + 0.015}>
      {pads.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation-y={p.rot}>
          <mesh rotation-x={-Math.PI / 2} scale={p.s}>
            <circleGeometry args={[1, 18, 0.35, Math.PI * 2 - 0.7]} />
            <meshStandardMaterial color={i % 2 ? "#5f9e48" : "#6fae52"} roughness={0.7} />
          </mesh>
          {p.flower && (
            <group position={[0.05, 0.06, 0.05]} scale={p.s * 0.55}>
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <mesh key={k} rotation={[0.6, (k / 6) * Math.PI * 2, 0]} position={[Math.sin((k / 6) * Math.PI * 2) * 0.12, 0.05, Math.cos((k / 6) * Math.PI * 2) * 0.12]} scale={[0.12, 0.05, 0.22]}>
                  <sphereGeometry args={[1, 8, 6]} />
                  <meshStandardMaterial color="#ffb6cf" />
                </mesh>
              ))}
              <mesh position-y={0.1}>
                <sphereGeometry args={[0.08, 8, 6]} />
                <meshStandardMaterial color="#ffd36e" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

const LAMP_SPOTS: [number, number][] = [
  [-1.6, 14.5],
  [1.6, 14.5],
  [-1.6, 2.5],
  [-3.0, -7.4],
  [3.0, -7.4],
];

function Lamps() {
  return (
    <group>
      {LAMP_SPOTS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position-y={0.12}>
            <cylinderGeometry args={[0.13, 0.16, 0.24, 10]} />
            <meshStandardMaterial color="#3f3448" roughness={0.6} />
          </mesh>
          <mesh position-y={1.1} castShadow>
            <cylinderGeometry args={[0.045, 0.06, 2.0, 8]} />
            <meshStandardMaterial color="#3f3448" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position-y={2.2}>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshStandardMaterial color="#fff2cf" emissive="#ffd88a" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
          <mesh position-y={2.42}>
            <coneGeometry args={[0.2, 0.2, 8]} />
            <meshStandardMaterial color="#3f3448" roughness={0.6} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Hedges lining the main road, with gaps where side paths branch off. */
const HEDGES: [number, number, number][] = [
  // [x, z from, z to]
  [-1.55, 2.9, 7.0],
  [1.55, 2.9, 7.0],
  [-1.55, 9.2, 11.4],
  [1.55, 9.2, 11.4],
];

const TOPIARIES: [number, number][] = [
  [-2.3, 0.6],
  [2.4, 0.4],
  [-3.6, -2.6],
  [-2.6, 11.2],
  [2.6, 11.2],
];

function Hedges() {
  return (
    <group>
      {HEDGES.map(([x, z0, z1], i) => (
        <RoundedBox
          key={i}
          args={[0.55, 0.7, z1 - z0]}
          radius={0.2}
          smoothness={3}
          position={[x, 0.35, (z0 + z1) / 2]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#3f7f3b" roughness={0.95} />
        </RoundedBox>
      ))}
      {TOPIARIES.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position-y={0.35}>
            <cylinderGeometry args={[0.06, 0.08, 0.7, 6]} />
            <meshStandardMaterial color="#7a5446" />
          </mesh>
          <mesh position-y={0.95} castShadow>
            <sphereGeometry args={[0.42, 18, 14]} />
            <meshStandardMaterial color="#4f9a45" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const PATH_COLOR = "#ddd5cc";
const isMain = (a: XZ, b: XZ) => a[0] === 0 && b[0] === 0;

/** Stepping stones scattered along every path. */
const PATH_STONES: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  SEGMENTS.forEach(([a, b], si) => {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const nx = -dz / len;
    const nz = dx / len;
    const half = isMain(a, b) ? 0.48 : 0.3;
    for (let d = 0.6, k = 0; d < len - 0.3; d += 1.0, k++) {
      const side = k % 2 ? 1 : -1;
      const wob = Math.sin(d * 2.3 + si) * 0.1;
      out.push([a[0] + (dx / len) * d + nx * (half * side + wob), a[1] + (dz / len) * d + nz * (half * side + wob), 0.24 + ((k + si) % 3) * 0.04]);
    }
  });
  return out;
})();

function Paths() {
  return (
    <group>
      {SEGMENTS.map(([a, b], i) => {
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        const w = isMain(a, b) ? 2.0 : 1.4;
        return (
          <group key={i} position={[(a[0] + b[0]) / 2, 0.012, (a[1] + b[1]) / 2]} rotation-y={Math.atan2(dx, dz)}>
            <mesh rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[w, len]} />
              <meshStandardMaterial color={PATH_COLOR} roughness={1} />
            </mesh>
          </group>
        );
      })}
      {Object.entries(NODES).map(([k, [x, z]]) => (
        <mesh key={k} position={[x, 0.013, z]} rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[x === 0 ? 1.0 : 0.7, 24]} />
          <meshStandardMaterial color={PATH_COLOR} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Grass ---------- */

/** Places where no grass should grow: [x, z, radius]. */
const GRASS_HOLES: [number, number, number][] = [
  [-11, 1.5, 2.3],
  [4.8, 1.8, 2.7],
  [7, 8.2, 1.4],
  [-9, -6.5, 1.9],
  [10.2, -5, 0.9],
  [0, -5.2, 3.5],
];

export function Grass({ count = 14000 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.13, 0.75, 1, 4);
    g.translate(0, 0.375, 0);
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uBase: { value: new THREE.Color("#3f8a2c") },
          uTip: { value: new THREE.Color("#b9ea6a") },
        },
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying float vH;
          varying float vVar;
          void main() {
            vec3 p = position;
            float h = uv.y;
            p.x *= (1.0 - h * 0.9);
            vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
            vec3 base = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            float sway = sin(uTime * 1.6 + base.x * 0.31 + base.z * 0.23) * 0.6
                       + sin(uTime * 2.7 + base.x * 0.9 - base.z * 0.4) * 0.25;
            world.x += sway * 0.16 * h * h;
            world.z += sway * 0.07 * h * h;
            vH = h;
            vVar = fract(sin(dot(base.xz, vec2(12.9898, 78.233))) * 43758.5453);
            gl_Position = projectionMatrix * viewMatrix * world;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uBase, uTip;
          varying float vH;
          varying float vVar;
          void main() {
            vec3 c = mix(uBase, uTip, smoothstep(0.0, 1.0, vH));
            c *= 0.82 + 0.32 * vVar;
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );

  const placed = useMemo(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const e = new THREE.Euler();
    const out: THREE.Matrix4[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let tries = 0;
    while (out.length < count && tries < count * 4) {
      tries++;
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * (plateauRadius(a) - 0.35);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < 1.25 && z > -8.6 && z < 16.2) continue;
      if (distanceToPath(x, z) < 0.95) continue;
      if (x > -6.4 && x < 6.4 && z < -7.9) continue;
      if (GRASS_HOLES.some(([hx, hz, hr]) => (x - hx) ** 2 + (z - hz) ** 2 < hr * hr)) continue;
      const tall = 0.65 + rnd() * 0.7;
      p.set(x, 0, z);
      e.set((rnd() - 0.5) * 0.3, rnd() * Math.PI, (rnd() - 0.5) * 0.3);
      q.setFromEuler(e);
      s.set(1, tall, 1);
      out.push(m.compose(p, q, s).clone());
    }
    return out;
  }, [count]);

  useFrame((st) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime;
  });

  return (
    <instancedMesh
      ref={(node) => {
        mesh.current = node!;
        if (node && !node.userData.filled) {
          placed.forEach((mx, i) => node.setMatrixAt(i, mx));
          node.instanceMatrix.needsUpdate = true;
          node.userData.filled = true;
        }
      }}
      args={[geo, mat, placed.length]}
      frustumCulled={false}
    />
  );
}

/* ---------- Trees, clouds, distant hills ---------- */

const TREES: [number, number, "pink" | "green", number][] = [
  [-13, -2, "pink", 1.1],
  [-12.5, 6.5, "green", 1],
  [-4.2, 11, "pink", 0.9],
  [3.0, 11.6, "pink", 0.95],
  [-10.6, 10.4, "green", 1],
  [12.5, -8, "pink", 1.15],
  [-12, -10, "green", 1.05],
  [-6.5, -11.5, "pink", 1],
  [7.2, -9.5, "green", 0.95],
  [13.6, 7, "pink", 0.9],
  [-6.5, 1.8, "green", 0.8],
  [9.5, 3.8, "pink", 0.85],
  [-8.5, 12, "pink", 0.9],
  [14.2, -5.6, "green", 0.85],
  [-14.3, 3, "green", 0.8],
];

export function Trees() {
  return (
    <group>
      {TREES.map(([x, z, kind, s], i) => (
        <Tree key={i} position={[x, 0, z]} kind={kind} scale={s} seed={i} />
      ))}
    </group>
  );
}

function Tree({
  position,
  kind,
  scale,
  seed,
}: {
  position: [number, number, number];
  kind: "pink" | "green";
  scale: number;
  seed: number;
}) {
  const leaf = kind === "pink" ? "#f6b5cb" : "#6fbf4f";
  const leaf2 = kind === "pink" ? "#f9cddc" : "#87d061";
  const g = useRef<THREE.Group>(null!);
  useFrame((st) => {
    if (g.current) g.current.rotation.z = Math.sin(st.clock.elapsedTime * 0.8 + seed) * 0.015;
  });
  return (
    <group position={position} scale={scale} ref={g}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.26, 2.4, 8]} />
        <meshStandardMaterial color="#7a5446" roughness={1} />
      </mesh>
      <mesh position={[0, 3.0, 0]} castShadow>
        <sphereGeometry args={[1.45, 18, 14]} />
        <meshStandardMaterial color={leaf} roughness={0.9} />
      </mesh>
      <mesh position={[0.9, 2.6, 0.3]} castShadow>
        <sphereGeometry args={[0.95, 16, 12]} />
        <meshStandardMaterial color={leaf2} roughness={0.9} />
      </mesh>
      <mesh position={[-0.8, 2.75, -0.2]} castShadow>
        <sphereGeometry args={[1.0, 16, 12]} />
        <meshStandardMaterial color={leaf2} roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 3.9, -0.1]} castShadow>
        <sphereGeometry args={[0.85, 16, 12]} />
        <meshStandardMaterial color={leaf} roughness={0.9} />
      </mesh>
    </group>
  );
}

const CLOUDS: [number, number, number, number][] = [
  [-40, 26, -60, 1.4],
  [30, 30, -70, 1.8],
  [60, 24, -10, 1.3],
  [-65, 28, 10, 1.6],
  [10, 34, -95, 2.2],
  [-20, 22, 50, 1.2],
  [45, 27, 45, 1.4],
];

export function Clouds() {
  const g = useRef<THREE.Group>(null!);
  useFrame((st) => {
    if (g.current) g.current.rotation.y = st.clock.elapsedTime * 0.006;
  });
  return (
    <group ref={g}>
      {CLOUDS.map(([x, y, z, s], i) => (
        <group key={i} position={[x, y, z]} scale={s}>
          {[
            [0, 0, 0, 3],
            [3, -0.5, 0.5, 2.3],
            [-3, -0.6, 0, 2.1],
            [1.2, 1.3, -0.3, 2.2],
            [-1.4, 0.9, 0.6, 1.8],
          ].map(([cx, cy, cz, r], j) => (
            <mesh key={j} position={[cx, cy, cz]}>
              <sphereGeometry args={[r, 14, 10]} />
              <meshStandardMaterial color="#ffffff" roughness={1} emissive="#fff4f8" emissiveIntensity={0.55} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Hills() {
  const hills = useMemo(() => {
    const out: [number, number, number, number][] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.3;
      const d = 150 + (i % 3) * 25;
      out.push([Math.cos(a) * d, Math.sin(a) * d, 22 + ((i * 37) % 23), 30 + ((i * 53) % 25)]);
    }
    return out;
  }, []);
  return (
    <group>
      {hills.map(([x, z, h, r], i) => (
        <mesh key={i} position={[x, h / 2 - 2, z]}>
          <coneGeometry args={[r, h, 7]} />
          <meshStandardMaterial color="#c9b4dc" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}
