"use client";

import { Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { story } from "@/story";
import { Characters } from "./Characters";
import { Fireworks, HeartPool } from "./fx";
import { boatPose, FINALE, layout, RIDE, type V3 } from "./layout";
import { Castle, Dock, Dragon, Easel, Gates, Gazebo, RoseGarden, SwanBoat, TeaParty, Throne, Well } from "./Props";
import { since, type TourState } from "./util";
import { Atmosphere, Clouds, Grass, Hills, Island, Trees, Water } from "./World";

function CameraRig({ tour }: { tour: TourState }) {
  const { camera, size } = useThree();
  const pos = useRef(new THREE.Vector3(0, 24, 52));
  const look = useRef(new THREE.Vector3(0, 2, 0));
  const wantPos = useRef(new THREE.Vector3());
  const wantLook = useRef(new THREE.Vector3());

  useFrame((st, dtRaw) => {
    const dt = Math.min(dtRaw, 0.25);
    const t = st.clock.elapsedTime;
    let cam: V3;
    let tgt: V3;
    let speed = 1.5;
    if (tour.phase === "intro") {
      const a = t * 0.05 + 0.4;
      cam = [Math.sin(a) * 44, 21, Math.cos(a) * 44];
      tgt = [0, 2, -2];
      speed = 2;
    } else if (tour.phase === "finale") {
      cam = FINALE.cam;
      tgt = FINALE.look;
      speed = 0.8;
    } else {
      const id = tour.phase === "flyover" ? "gates" : story.memories[tour.stopIndex].id;
      cam = layout[id].cam;
      tgt = layout[id].look;
      if (tour.phase === "flyover") speed = 0.75;
      if (id === "swan") {
        const e = since(tour.acted, "swan");
        if (e != null && e < RIDE.end + 0.6) {
          // Follow the boat round the lake.
          const b = boatPose(e, t);
          tgt = [b.x, b.y + 0.6, b.z];
          cam = [b.x - 3.2, 2.8, b.z + 5.8];
          speed = 2.2;
        }
      }
    }
    // Tall phone screens see less side to side, so back the camera off.
    const aspect = size.width / size.height;
    const pull = aspect < 1 ? 1 + (1 - aspect) * 0.8 : 1;
    wantLook.current.set(...tgt);
    wantPos.current.set(...cam).sub(wantLook.current).multiplyScalar(pull).add(wantLook.current);
    // Gentle drift so the frame never feels frozen.
    wantPos.current.x += Math.sin(t * 0.3) * 0.25;
    wantPos.current.y += Math.sin(t * 0.23) * 0.15;
    // Never let the pull-back push the camera under the ground.
    wantPos.current.y = Math.max(wantPos.current.y, 1.4);
    const k = 1 - Math.exp(-dt * speed);
    pos.current.lerp(wantPos.current, k);
    look.current.lerp(wantLook.current, Math.min(1, k * 1.3));
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  return null;
}

/** Glow on lit windows, lamps and fireworks, filmic colour, and a soft vignette. */
function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={1.35} luminanceSmoothing={0.2} radius={0.7} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.38} />
    </EffectComposer>
  );
}

export function Scene({ tour, effects = true }: { tour: TourState; effects?: boolean }) {
  const finale = tour.phase === "finale";
  const castleLit = finale || tour.acted.castle != null;
  return (
    <>
      <Atmosphere dusk={finale} />
      <CameraRig tour={tour} />
      {effects && <Effects />}
      <Hills />
      <Clouds />
      <Water />
      <Island />
      <Grass />
      <Trees />
      <Castle acted={tour.acted} lit={castleLit} />
      <Gates acted={tour.acted} />
      <RoseGarden acted={tour.acted} />
      <TeaParty acted={tour.acted} />
      <Dragon acted={tour.acted} />
      <Well acted={tour.acted} />
      <Dock />
      <SwanBoat acted={tour.acted} />
      <Easel acted={tour.acted} />
      <Gazebo acted={tour.acted} />
      <Throne />
      <Characters tour={tour} />
      <HeartPool />
      <Fireworks active={finale} />
      <Sparkles count={120} scale={[32, 5, 32]} position={[0, 2.5, 0]} size={4} speed={0.35} color="#fff3c4" opacity={0.9} />
    </>
  );
}
