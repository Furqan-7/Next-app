"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useCallback, useEffect, useRef, useState } from "react";
import { startMusic, stopMusic } from "@/lib/music";
import { FINALE, layout, WALK_SPEED, type V3 } from "@/scene/layout";
import { routeLength } from "@/scene/paths";
import { Scene } from "@/scene/Scene";
import { now, type TourState } from "@/scene/util";
import { story } from "@/story";
import { Overlay } from "@/ui/Overlay";

const LAST = story.memories.length - 1;

export default function Experience() {
  const [tour, setTour] = useState<TourState>({
    phase: "intro",
    stopIndex: 0,
    stopPhase: "ready",
    acted: {},
  });
  const [auto, setAuto] = useState(false);
  const [music, setMusic] = useState(false);
  const tourRef = useRef(tour);
  tourRef.current = tour;
  const timer = useRef<number | undefined>(undefined);
  const lastPos = useRef<V3>(layout.gates.princess);

  const schedule = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };
  const update = (next: TourState) => {
    tourRef.current = next;
    setTour(next);
  };

  const goTo = useCallback((i: number, base?: TourState) => {
    const t = base ?? tourRef.current;
    const id = story.memories[i].id;
    const l = layout[id];
    const dest = t.acted[id] != null && l.after ? l.after.princess : l.princess;
    const from = lastPos.current;
    const dist = routeLength([from[0], from[2]], [dest[0], dest[2]]);
    const ms = Math.max(1500, (dist / WALK_SPEED) * 1000 + 600);
    lastPos.current = dest;
    update({ ...t, phase: "tour", stopIndex: i, stopPhase: "travel" });
    schedule(() => update({ ...tourRef.current, stopPhase: "ready" }), ms);
  }, []);

  const act = useCallback(() => {
    const t = tourRef.current;
    if (t.phase !== "tour" || t.stopPhase === "acting" || t.stopPhase === "card") return;
    const id = story.memories[t.stopIndex].id;
    const l = layout[id];
    if (l.after) lastPos.current = l.after.princess;
    update({ ...t, stopPhase: "acting", acted: { ...t.acted, [id]: now() } });
    schedule(() => update({ ...tourRef.current, stopPhase: "card" }), l.duration * 1000);
  }, []);

  const next = useCallback(() => {
    const t = tourRef.current;
    if (t.stopIndex < LAST) goTo(t.stopIndex + 1);
    else {
      window.clearTimeout(timer.current);
      update({ ...t, phase: "letter" });
    }
  }, [goTo]);

  const back = useCallback(() => {
    const t = tourRef.current;
    if (t.stopIndex > 0) goTo(t.stopIndex - 1);
  }, [goTo]);

  const start = useCallback(() => {
    startMusic(story.song);
    setMusic(true);
    update({ ...tourRef.current, phase: "flyover" });
    schedule(() => update({ ...tourRef.current, phase: "tour", stopIndex: 0, stopPhase: "ready" }), 4300);
  }, []);

  const finale = useCallback(() => {
    window.clearTimeout(timer.current);
    lastPos.current = FINALE.princess;
    setAuto(false);
    update({ ...tourRef.current, phase: "finale" });
  }, []);

  const replay = useCallback(() => {
    goTo(0, { ...tourRef.current, acted: {} });
  }, [goTo]);

  const letter = useCallback(() => {
    window.clearTimeout(timer.current);
    update({ ...tourRef.current, phase: "letter" });
  }, []);

  const toggleMusic = useCallback(() => {
    setMusic((m) => {
      if (m) stopMusic();
      else startMusic(story.song);
      return !m;
    });
  }, []);

  // Auto mode plays each moment, then moves on.
  useEffect(() => {
    if (!auto || tour.phase !== "tour") return;
    let id: number | undefined;
    if (tour.stopPhase === "ready") id = window.setTimeout(act, 1500);
    else if (tour.stopPhase === "card") id = window.setTimeout(next, 5500);
    return () => window.clearTimeout(id);
  }, [auto, tour.phase, tour.stopPhase, tour.stopIndex, act, next]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <main className="stage">
      <Canvas
        className="canvas"
        shadows={{ type: THREE.PCFShadowMap }}
        flat
        dpr={[1, 2]}
        camera={{ fov: 50, near: 0.1, far: 1200, position: [0, 24, 52] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Scene tour={tour} />
      </Canvas>
      <Overlay
        tour={tour}
        auto={auto}
        music={music}
        onStart={start}
        onAct={act}
        onNext={next}
        onBack={back}
        onJump={(i) => goTo(i)}
        onToggleAuto={() => setAuto((a) => !a)}
        onToggleMusic={toggleMusic}
        onFinale={finale}
        onReplay={replay}
        onLetter={letter}
      />
    </main>
  );
}
