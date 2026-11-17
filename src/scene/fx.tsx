"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* ---------- Floating hearts ---------- */

interface Burst {
  pos: [number, number, number];
  count: number;
  spread: number;
  size: number;
}
const queue: Burst[] = [];

export function emitHearts(
  pos: [number, number, number],
  count = 12,
  spread = 0.6,
  size = 1,
) {
  queue.push({ pos, count, spread, size });
}

export function makeHeartGeometry(depth = 2) {
  const s = new THREE.Shape();
  s.moveTo(5, 5);
  s.bezierCurveTo(5, 5, 4, 0, 0, 0);
  s.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  s.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  s.bezierCurveTo(16, 7, 16, 0, 10, 0);
  s.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: 1,
    bevelThickness: 1,
    bevelSegments: 2,
    curveSegments: 10,
  });
  g.center();
  g.rotateZ(Math.PI);
  g.scale(0.02, 0.02, 0.02);
  return g;
}

const HEARTS = 180;
const HEART_COLORS = ["#ff5c8a", "#ff8fb1", "#ff3d6e", "#ffb3c9", "#f7487a"];

export function HeartPool() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const geo = useMemo(() => makeHeartGeometry(), []);
  const data = useMemo(
    () => ({
      alive: new Uint8Array(HEARTS),
      age: new Float32Array(HEARTS),
      life: new Float32Array(HEARTS),
      size: new Float32Array(HEARTS),
      pos: new Float32Array(HEARTS * 3),
      vel: new Float32Array(HEARTS * 3),
      next: 0,
    }),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((_, dtRaw) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(dtRaw, 0.1);
    while (queue.length) {
      const b = queue.shift()!;
      for (let k = 0; k < b.count; k++) {
        const i = data.next;
        data.next = (data.next + 1) % HEARTS;
        data.alive[i] = 1;
        data.age[i] = -k * 0.03;
        data.life[i] = 1.6 + Math.random() * 1.0;
        data.size[i] = b.size * (0.7 + Math.random() * 0.6);
        data.pos[i * 3] = b.pos[0] + (Math.random() - 0.5) * b.spread;
        data.pos[i * 3 + 1] = b.pos[1] + Math.random() * 0.3;
        data.pos[i * 3 + 2] = b.pos[2] + (Math.random() - 0.5) * b.spread;
        data.vel[i * 3] = (Math.random() - 0.5) * 0.8;
        data.vel[i * 3 + 1] = 1.0 + Math.random() * 1.2;
        data.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        color.set(HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0]);
        m.setColorAt(i, color);
      }
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    for (let i = 0; i < HEARTS; i++) {
      if (!data.alive[i]) {
        dummy.position.set(0, -50, 0);
        dummy.scale.setScalar(0);
      } else {
        data.age[i] += dt;
        const a = data.age[i];
        if (a > 0) {
          data.pos[i * 3] += data.vel[i * 3] * dt;
          data.pos[i * 3 + 1] += data.vel[i * 3 + 1] * dt;
          data.pos[i * 3 + 2] += data.vel[i * 3 + 2] * dt;
          data.vel[i * 3] += Math.sin(a * 4 + i) * 0.02;
        }
        const life = data.life[i];
        const grow = Math.min(1, Math.max(0, a / 0.25));
        const fade = 1 - Math.min(1, Math.max(0, (a - life * 0.6) / (life * 0.4)));
        dummy.position.set(data.pos[i * 3], data.pos[i * 3 + 1], data.pos[i * 3 + 2]);
        dummy.rotation.set(0, a * 2.5 + i, Math.sin(a * 3 + i) * 0.3);
        dummy.scale.setScalar(Math.max(0, grow * fade * data.size[i]));
        if (a > life) data.alive[i] = 0;
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, HEARTS]} frustumCulled={false}>
      <meshBasicMaterial color="#ffffff" toneMapped={false} />
    </instancedMesh>
  );
}

/* ---------- Fireworks ---------- */

const SPARKS = 2600;
const FW_COLORS = ["#ff7eb6", "#ffd36e", "#9ad0ff", "#c9a2ff", "#ffffff", "#ff9a8a"];

function makeDotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.3, "rgba(255,255,255,0.8)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

interface Rocket {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fuse: number;
  color: THREE.Color;
}

export function Fireworks({ active }: { active: boolean }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    return g;
  }, []);
  const tex = useMemo(() => makeDotTexture(), []);
  const st = useMemo(
    () => ({
      vel: new Float32Array(SPARKS * 3),
      base: new Float32Array(SPARKS * 3),
      age: new Float32Array(SPARKS).fill(99),
      life: new Float32Array(SPARKS).fill(1),
      next: 0,
      rockets: [] as Rocket[],
      timer: 0.2,
    }),
    [],
  );

  const spawn = (x: number, y: number, z: number, vx: number, vy: number, vz: number, c: THREE.Color, life: number) => {
    const i = st.next;
    st.next = (st.next + 1) % SPARKS;
    const p = geo.attributes.position.array as Float32Array;
    p[i * 3] = x;
    p[i * 3 + 1] = y;
    p[i * 3 + 2] = z;
    st.vel[i * 3] = vx;
    st.vel[i * 3 + 1] = vy;
    st.vel[i * 3 + 2] = vz;
    st.base[i * 3] = c.r;
    st.base[i * 3 + 1] = c.g;
    st.base[i * 3 + 2] = c.b;
    st.age[i] = 0;
    st.life[i] = life;
  };

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (active) {
      st.timer -= dt;
      if (st.timer <= 0) {
        st.timer = 0.35 + Math.random() * 0.45;
        st.rockets.push({
          x: (Math.random() - 0.5) * 18,
          y: 3,
          z: -11 + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.5,
          vy: 15 + Math.random() * 4,
          vz: (Math.random() - 0.5) * 1.5,
          fuse: 1.0 + Math.random() * 0.4,
          color: new THREE.Color(FW_COLORS[(Math.random() * FW_COLORS.length) | 0]),
        });
      }
    }
    const trail = new THREE.Color("#ffe2b0");
    for (let r = st.rockets.length - 1; r >= 0; r--) {
      const k = st.rockets[r];
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.z += k.vz * dt;
      k.vy -= 7 * dt;
      k.fuse -= dt;
      spawn(k.x, k.y, k.z, 0, -0.5, 0, trail, 0.45);
      if (k.fuse <= 0) {
        const n = 110;
        const speed = 5 + Math.random() * 2.5;
        const heart = Math.random() < 0.35;
        for (let j = 0; j < n; j++) {
          let vx: number, vy: number, vz: number;
          if (heart) {
            const t = (j / n) * Math.PI * 2;
            vx = 16 * Math.pow(Math.sin(t), 3) / 16;
            vy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
            vz = (Math.random() - 0.5) * 0.15;
            vx *= speed;
            vy *= speed;
            vz *= speed;
          } else {
            const u = Math.random() * 2 - 1;
            const a = Math.random() * Math.PI * 2;
            const s = Math.sqrt(1 - u * u);
            const sp = speed * (0.85 + Math.random() * 0.3);
            vx = s * Math.cos(a) * sp;
            vy = u * sp;
            vz = s * Math.sin(a) * sp;
          }
          spawn(k.x, k.y, k.z, vx, vy, vz, k.color, 1.6 + Math.random() * 0.8);
        }
        st.rockets.splice(r, 1);
      }
    }
    const p = geo.attributes.position.array as Float32Array;
    const c = geo.attributes.color.array as Float32Array;
    for (let i = 0; i < SPARKS; i++) {
      const a = (st.age[i] += dt);
      const life = st.life[i];
      if (a > life) {
        c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = 0;
        continue;
      }
      st.vel[i * 3] *= 0.98;
      st.vel[i * 3 + 1] = st.vel[i * 3 + 1] * 0.98 - 2.2 * dt;
      st.vel[i * 3 + 2] *= 0.98;
      p[i * 3] += st.vel[i * 3] * dt;
      p[i * 3 + 1] += st.vel[i * 3 + 1] * dt;
      p[i * 3 + 2] += st.vel[i * 3 + 2] * dt;
      const f = Math.pow(1 - a / life, 1.4) * (0.75 + 0.25 * Math.sin(a * 30 + i));
      c[i * 3] = st.base[i * 3] * f;
      c[i * 3 + 1] = st.base[i * 3 + 1] * f;
      c[i * 3 + 2] = st.base[i * 3 + 2] * f;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.55}
        map={tex}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
        toneMapped={false}
      />
    </points>
  );
}
