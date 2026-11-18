"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { story } from "@/story";
import { emitHearts } from "./fx";
import { boatPose, FINALE, layout, RIDE, WALK_SPEED, type V3 } from "./layout";
import { route, type XZ } from "./paths";
import { makeLeafGeometry, makeRoseGeometry } from "./rose";
import { angleLerp, clamp01, easeInOut, shared, since, type TourState } from "./util";

type Kind = "princess" | "prince";
type Pose = "stand" | "kneel" | "hug" | "sit";

const SKIN = "#f8d6c3";
const HAIR = "#3b2420";

function plan(kind: Kind, tour: TourState): { pos: V3; face: V3; pose: Pose } {
  if (tour.phase === "intro" || tour.phase === "flyover") {
    return { pos: layout.gates[kind], face: layout.gates.face, pose: "stand" };
  }
  if (tour.phase === "finale") {
    return { pos: FINALE[kind], face: FINALE.face, pose: "stand" };
  }
  const id = story.memories[tour.stopIndex].id;
  const l = layout[id];
  const acted = tour.acted[id] != null;
  const spot = acted && l.after ? l.after : l;
  let face = l.face;
  if (acted && l.after?.faceEachOther) face = kind === "princess" ? l.after.prince : l.after.princess;
  if (id === "throne" && kind === "prince") face = l.princess;
  let pose: Pose = "stand";
  if (acted && id === "throne" && kind === "prince") pose = "kneel";
  if (acted && id === "gazebo" && tour.stopPhase !== "travel") pose = "hug";
  if (id === "tea" && tour.stopPhase !== "travel") pose = "sit";
  return { pos: spot[kind], face, pose };
}

export function Person({ kind, tour }: { kind: Kind; tour: TourState }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const st = useRef({
    pos: new THREE.Vector3(...layout.gates[kind]),
    yaw: Math.PI,
    walk: 0,
    move: 0,
    kneel: 0,
    hug: 0,
    sit: 0,
  });
  const dir = useRef(new THREE.Vector3());
  // Waypoints along the footpaths to the current destination.
  const nav = useRef<{ key: string; pts: XZ[] }>({ key: "", pts: [] });

  useFrame((clock, dtRaw) => {
    const dt = Math.min(dtRaw, 0.25);
    const s = st.current;
    const p = plan(kind, tour);
    const t = clock.clock.elapsedTime;

    // Riding the swan boat overrides walking.
    let riding = false;
    let rideYaw = 0;
    const id = story.memories[tour.stopIndex]?.id;
    if (tour.phase === "tour" && id === "swan") {
      const e = since(tour.acted, "swan");
      if (e != null && e > RIDE.board && e < RIDE.end) {
        const bp = boatPose(e, t);
        // Seats on the bench (boat-local x, z).
        const ox = kind === "princess" ? -0.27 : 0.27;
        const oz = -0.12;
        const c = Math.cos(bp.yaw);
        const sn = Math.sin(bp.yaw);
        s.pos.set(bp.x + ox * c + oz * sn, bp.y + 0.07, bp.z - ox * sn + oz * c);
        riding = true;
        rideYaw = bp.yaw;
      }
    }

    let moving = false;
    const d = dir.current;
    if (riding) {
      nav.current.key = "";
    } else {
      const key = p.pos.join(",");
      if (nav.current.key !== key) {
        nav.current = {
          key,
          pts: route([s.pos.x, s.pos.z], [p.pos[0], p.pos[2]], kind === "princess" ? -0.32 : 0.32),
        };
      }
      const pts = nav.current.pts;
      let wp: XZ = pts[0] ?? [p.pos[0], p.pos[2]];
      d.set(wp[0] - s.pos.x, 0, wp[1] - s.pos.z);
      let dist = d.length();
      while (dist < 0.2 && pts.length > 1) {
        pts.shift();
        wp = pts[0];
        d.set(wp[0] - s.pos.x, 0, wp[1] - s.pos.z);
        dist = d.length();
      }
      if (dist > 0.02) {
        const step = Math.min(dist, WALK_SPEED * dt);
        d.multiplyScalar(step / dist);
        s.pos.add(d);
        moving = dist > 0.06 || pts.length > 1;
      }
      // Only step up onto the gazebo, dock or dais on the final stretch.
      const wantY = pts.length <= 1 ? p.pos[1] : 0;
      s.pos.y += (wantY - s.pos.y) * Math.min(1, dt * 8);
    }

    let want = s.yaw;
    if (riding) want = rideYaw;
    else if (moving) want = Math.atan2(d.x, d.z);
    else want = Math.atan2(p.face[0] - s.pos.x, p.face[2] - s.pos.z);
    s.yaw = angleLerp(s.yaw, want, Math.min(1, dt * 8));

    const k = Math.min(1, dt * 7);
    s.move += ((moving ? 1 : 0) - s.move) * Math.min(1, dt * 12);
    s.kneel += ((p.pose === "kneel" && !moving ? 1 : 0) - s.kneel) * k;
    s.hug += ((p.pose === "hug" && !moving ? 1 : 0) - s.hug) * k;
    s.sit += ((riding || (p.pose === "sit" && !moving) ? 1 : 0) - s.sit) * k;
    if (moving) s.walk += dt * 12;

    root.current.position.copy(s.pos);
    root.current.rotation.y = s.yaw;

    const swing = Math.sin(s.walk) * 0.75 * s.move;
    const breathe = Math.sin(t * 2 + (kind === "prince" ? 1 : 0)) * 0.012;
    legL.current.rotation.x = swing - s.kneel * 1.3 - s.sit * 1.45;
    legR.current.rotation.x = -swing + s.kneel * 0.2 - s.sit * 1.45;
    armL.current.rotation.x = -swing * 0.9 - s.hug * 1.25 - s.kneel * 0.2 - s.sit * 0.45;
    armR.current.rotation.x = swing * 0.9 - s.hug * 1.25 - s.kneel * 1.1 - s.sit * 0.45;
    armL.current.rotation.z = s.hug * 0.55 + 0.08;
    armR.current.rotation.z = -s.hug * 0.55 - 0.08;
    body.current.position.y =
      Math.abs(Math.sin(s.walk)) * 0.07 * s.move - s.kneel * 0.3 - s.sit * 0.08 + breathe;
    body.current.rotation.x = s.kneel * 0.12 + s.hug * 0.08;
    body.current.position.z = s.hug * 0.05;

    if (kind === "princess") {
      shared.princess.copy(s.pos);
      shared.princessYaw = s.yaw;
    } else shared.prince.copy(s.pos);
  });

  const princess = kind === "princess";
  return (
    <group ref={root}>
      <group ref={body}>
        {/* Legs */}
        {[
          [legL, 0.11],
          [legR, -0.11],
        ].map(([ref, x]) => (
          <group key={x as number} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 0.5, 0]}>
            <mesh position={[0, -0.24, 0]} castShadow>
              <capsuleGeometry args={[princess ? 0.07 : 0.09, 0.32, 4, 8]} />
              <meshStandardMaterial color={princess ? SKIN : "#2b3a67"} />
            </mesh>
            <mesh position={[0, -0.47, 0.05]} castShadow>
              <boxGeometry args={[0.15, 0.08, 0.24]} />
              <meshStandardMaterial color={princess ? "#e8507f" : "#3a2a26"} />
            </mesh>
          </group>
        ))}
        {/* Body */}
        {princess ? (
          <>
            <mesh position={[0, 0.58, 0]} castShadow>
              <cylinderGeometry args={[0.17, 0.46, 0.72, 20]} />
              <meshStandardMaterial color="#f39ac0" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <torusGeometry args={[0.44, 0.04, 6, 24]} />
              <meshStandardMaterial color="#ffd1e1" />
            </mesh>
            <mesh position={[0, 0.98, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.18, 0.28, 16]} />
              <meshStandardMaterial color="#f7b6cf" />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[0, 0.82, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.25, 0.6, 16]} />
              <meshStandardMaterial color="#fbf8f2" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.54, 0]}>
              <cylinderGeometry args={[0.255, 0.255, 0.07, 16]} />
              <meshStandardMaterial color="#5a3d33" />
            </mesh>
          </>
        )}
        {/* Arms (pivot at shoulder) */}
        {[
          [armL, 0.25],
          [armR, -0.25],
        ].map(([ref, x]) => (
          <group key={x as number} ref={ref as React.RefObject<THREE.Group>} position={[x as number, 1.05, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.065, 0.28, 4, 8]} />
              <meshStandardMaterial color={princess ? SKIN : "#fbf8f2"} />
            </mesh>
            <mesh position={[0, -0.39, 0]}>
              <sphereGeometry args={[0.065, 8, 8]} />
              <meshStandardMaterial color={SKIN} />
            </mesh>
            {princess && x === -0.25 && <RoseInHand tour={tour} />}
          </group>
        ))}
        {/* Head */}
        <group position={[0, 1.45, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.37, 24, 18]} />
            <meshStandardMaterial color={SKIN} roughness={0.8} />
          </mesh>
          {/* hair cap, tilted back so the face shows */}
          <mesh rotation-x={-0.55} castShadow>
            <sphereGeometry args={[0.395, 24, 16, 0, Math.PI * 2, 0, princess ? 1.5 : 1.35]} />
            <meshStandardMaterial color={HAIR} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.04, -0.09]}>
            <sphereGeometry args={[0.375, 20, 14]} />
            <meshStandardMaterial color={HAIR} roughness={0.8} />
          </mesh>
          {princess && (
            <>
              <mesh position={[0, -0.42, -0.22]} castShadow>
                <capsuleGeometry args={[0.24, 0.5, 4, 12]} />
                <meshStandardMaterial color={HAIR} roughness={0.8} />
              </mesh>
              <mesh position={[0.3, 0.12, 0.1]}>
                <sphereGeometry args={[0.07, 10, 8]} />
                <meshStandardMaterial color="#ff5c8a" />
              </mesh>
            </>
          )}
          {[-0.13, 0.13].map((x) => (
            <mesh key={x} position={[x, -0.02, 0.335]} scale={[1, 1.25, 0.6]}>
              <sphereGeometry args={[0.05, 10, 8]} />
              <meshStandardMaterial color="#231816" roughness={0.3} />
            </mesh>
          ))}
          {[-0.22, 0.22].map((x) => (
            <mesh key={x} position={[x, -0.12, 0.29]} rotation-y={x * 1.6}>
              <circleGeometry args={[0.06, 14]} />
              <meshBasicMaterial color="#ff9fb8" transparent opacity={0.75} />
            </mesh>
          ))}
          {princess && <Crown tour={tour} />}
        </group>
      </group>
    </group>
  );
}

function RoseInHand({ tour }: { tour: TourState }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    const e = since(tour.acted, "roses");
    const show = e != null && tour.phase !== "intro";
    const k = show ? clamp01((e! - 0.3) / 0.5) : 0;
    g.current.visible = k > 0.01;
    g.current.scale.setScalar(k);
  });
  const rose = useMemo(() => makeRoseGeometry(), []);
  const leaf = useMemo(() => makeLeafGeometry(), []);
  return (
    <group ref={g} position={[0, -0.42, 0.06]} rotation-x={0.5}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.014, 0.016, 0.42, 6]} />
        <meshStandardMaterial color="#3f8f45" />
      </mesh>
      <mesh geometry={leaf} position={[0.01, 0.06, 0]} rotation={[0, 0.4, -0.9]} scale={0.22}>
        <meshStandardMaterial color="#4f9a45" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rose} position={[0, 0.32, 0]} scale={0.26}>
        <meshStandardMaterial vertexColors roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Crown({ tour }: { tour: TourState }) {
  const g = useRef<THREE.Group>(null!);
  const fired = useRef<number | null>(null);
  useFrame((st) => {
    const start = tour.acted.throne;
    const e = since(tour.acted, "throne");
    if (e == null) {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    const k = easeInOut(clamp01(e / 1.5));
    g.current.position.y = 0.36 + (1 - k) * 2.6;
    g.current.rotation.y = (1 - k) * 6 + Math.sin(st.clock.elapsedTime) * 0.05;
    if (e > 1.5 && fired.current !== start) {
      fired.current = start!;
      const p = shared.princess;
      emitHearts([p.x, p.y + 2.1, p.z], 28, 1.2, 1.2);
    }
  });
  const points = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <group ref={g} position={[0, 0.36, -0.02]} visible={false}>
      <mesh>
        <cylinderGeometry args={[0.24, 0.22, 0.1, 24, 1, true]} />
        <meshStandardMaterial color="#f2c14e" metalness={0.6} roughness={0.25} side={THREE.DoubleSide} emissive="#a77a00" emissiveIntensity={0.25} />
      </mesh>
      {points.map((i) => {
        const a = (i / points.length) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.23, 0.1, Math.sin(a) * 0.23]}>
            <mesh>
              <coneGeometry args={[0.045, 0.14, 6]} />
              <meshStandardMaterial color="#f2c14e" metalness={0.6} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.025, 8, 6]} />
              <meshStandardMaterial color={i % 2 ? "#ff5c8a" : "#9ad0ff"} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Cat({ tour }: { tour: TourState }) {
  const root = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Mesh>(null!);
  const st = useRef({ pos: new THREE.Vector3(-1.2, 0, 15.4), yaw: Math.PI, walk: 0, move: 0 });
  const d = useRef(new THREE.Vector3());
  useFrame((clock, dtRaw) => {
    const dt = Math.min(dtRaw, 0.25);
    const s = st.current;
    const py = shared.princessYaw;
    // Sit just behind and to the side of the princess.
    const ox = -0.8;
    const oz = -0.35;
    const tx = shared.princess.x + ox * Math.cos(py) + oz * Math.sin(py);
    const tz = shared.princess.z - ox * Math.sin(py) + oz * Math.cos(py);
    const riding = tour.phase === "tour" && since(tour.acted, "swan") != null &&
      story.memories[tour.stopIndex]?.id === "swan" &&
      (since(tour.acted, "swan") ?? 99) < RIDE.end;
    d.current.set(riding ? 19.8 - s.pos.x : tx - s.pos.x, 0, riding ? 1.7 - s.pos.z : tz - s.pos.z);
    const dist = d.current.length();
    let moving = false;
    if (dist > 0.25) {
      const step = Math.min(dist - 0.2, WALK_SPEED * 1.1 * dt);
      d.current.multiplyScalar(step / dist);
      s.pos.add(d.current);
      moving = true;
    }
    s.pos.y += (shared.princess.y * (riding ? 0 : 1) + (riding ? 0.3 : 0) - s.pos.y) * Math.min(1, dt * 6);
    const want = moving ? Math.atan2(d.current.x, d.current.z) : py;
    s.yaw = angleLerp(s.yaw, want, Math.min(1, dt * 6));
    s.move += ((moving ? 1 : 0) - s.move) * Math.min(1, dt * 10);
    if (moving) s.walk += dt * 16;
    root.current.position.copy(s.pos);
    root.current.position.y += Math.abs(Math.sin(s.walk)) * 0.05 * s.move;
    root.current.rotation.y = s.yaw;
    tail.current.rotation.x = -0.8 + Math.sin(clock.clock.elapsedTime * 3) * 0.25;
    tail.current.rotation.z = Math.sin(clock.clock.elapsedTime * 2.2) * 0.3;
  });
  const orange = "#f29a4a";
  return (
    <group ref={root} scale={0.85}>
      <mesh position={[0, 0.28, 0]} scale={[0.9, 0.8, 1.3]} castShadow>
        <sphereGeometry args={[0.22, 14, 10]} />
        <meshStandardMaterial color={orange} />
      </mesh>
      <group position={[0, 0.55, 0.25]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 14, 12]} />
          <meshStandardMaterial color={orange} />
        </mesh>
        {[-0.11, 0.11].map((x) => (
          <mesh key={x} position={[x, 0.17, 0]}>
            <coneGeometry args={[0.07, 0.14, 4]} />
            <meshStandardMaterial color={orange} />
          </mesh>
        ))}
        {[-0.07, 0.07].map((x) => (
          <mesh key={x} position={[x, 0.02, 0.18]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        ))}
        <mesh position={[0, -0.05, 0.19]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#ff8fa8" />
        </mesh>
      </group>
      {[
        [-0.1, 0.15],
        [0.1, 0.15],
        [-0.1, -0.15],
        [0.1, -0.15],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 6]} />
          <meshStandardMaterial color="#fff1e0" />
        </mesh>
      ))}
      <mesh ref={tail} position={[0, 0.35, -0.28]}>
        <capsuleGeometry args={[0.035, 0.3, 4, 6]} />
        <meshStandardMaterial color={orange} />
      </mesh>
    </group>
  );
}

export function Characters({ tour }: { tour: TourState }) {
  return (
    <>
      <Person kind="princess" tour={tour} />
      <Person kind="prince" tour={tour} />
      <Cat tour={tour} />
    </>
  );
}

