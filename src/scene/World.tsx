"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ISLAND_RADIUS, WATER_Y } from "./layout";

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
    if (sun.current) sun.current.intensity = 2.3 - d * 1.5;
    if (hemi.current) hemi.current.intensity = 1.25 - d * 0.6;
  });

  return (
    <>
      <fog attach="fog" args={[DAY.fog, 70, 260]} />
      <mesh material={skyMat} renderOrder={-1}>
        <sphereGeometry args={[450, 32, 16]} />
      </mesh>
      <hemisphereLight ref={hemi} args={["#fff0f6", "#86b06e", 1.25]} />
      <directionalLight
        ref={sun}
        position={[18, 30, 14]}
        intensity={2.3}
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
      />
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
          uDeep: { value: new THREE.Color("#5fb8c9") },
          uShallow: { value: new THREE.Color("#a6e6dc") },
          uFoam: { value: new THREE.Color("#ffffff") },
          uFog: { value: new THREE.Color(DAY.fog) },
          uR: { value: ISLAND_RADIUS + 1 },
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
            vec3 c = mix(uDeep, uShallow, smoothstep(uR + 10.0, uR, r));
            float w = sin(vW.x * 0.7 + uTime * 1.1) * sin(vW.z * 0.6 - uTime * 0.8);
            w += 0.5 * sin(vW.x * 1.9 - uTime * 1.7 + vW.z * 1.3);
            c += w * 0.025;
            float ring = smoothstep(0.82, 1.0, sin((r - uTime * 0.5) * 2.6));
            float shore = smoothstep(uR + 4.0, uR + 0.3, r);
            c = mix(c, uFoam, ring * shore * 0.55);
            c = mix(c, uFoam, smoothstep(uR + 0.9, uR + 0.2, r) * 0.7);
            float glint = pow(max(0.0, sin(vW.x * 3.1 + uTime * 2.0) * sin(vW.z * 2.7 - uTime * 1.6)), 24.0);
            c += glint * 0.35;
            float d = length(vW - cameraPosition);
            c = mix(c, uFog, smoothstep(60.0, 300.0, d));
            gl_FragColor = vec4(c, 1.0);
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

export function Island() {
  return (
    <group>
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS + 0.2, 0.24, 72]} />
        <meshStandardMaterial color="#8ccc63" roughness={1} />
      </mesh>
      <mesh position={[0, -0.55, 0]} receiveShadow>
        <cylinderGeometry args={[ISLAND_RADIUS + 1.2, ISLAND_RADIUS + 2.6, 0.9, 72]} />
        <meshStandardMaterial color="#f3dcc0" roughness={1} />
      </mesh>
      {/* Path from the gates to the castle, and the plaza */}
      <mesh position={[0, 0.012, 4.2]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[2.2, 19.5]} />
        <meshStandardMaterial color="#ecd9bf" roughness={1} />
      </mesh>
      <mesh position={[0, 0.014, -5.2]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[3.4, 48]} />
        <meshStandardMaterial color="#efdcc4" roughness={1} />
      </mesh>
      {PATH_STONES.map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.03, z]} rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[r, 10]} />
          <meshStandardMaterial color="#ddc6ad" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

const PATH_STONES: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let z = 13.5; z > -3; z -= 1.1) {
    out.push([-0.45 + Math.sin(z * 2.1) * 0.15, z, 0.32]);
    out.push([0.5 + Math.cos(z * 1.7) * 0.15, z - 0.5, 0.28]);
  }
  return out;
})();

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
      const r = Math.sqrt(rnd()) * (ISLAND_RADIUS - 0.4);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < 1.35 && z > -8.6 && z < 14.2) continue;
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
  [3.6, 10.5, "pink", 0.95],
  [-10.6, 10.4, "green", 1],
  [12.5, -8, "pink", 1.15],
  [-12, -10, "green", 1.05],
  [-6.5, -11.5, "pink", 1],
  [7.2, -9.5, "green", 0.95],
  [13.6, 7, "pink", 0.9],
  [-3, -3.5, "green", 0.8],
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
