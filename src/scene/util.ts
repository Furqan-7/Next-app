import * as THREE from "three";
import type { StopId } from "@/story";

export type Phase = "intro" | "flyover" | "tour" | "letter" | "finale";
export type StopPhase = "travel" | "ready" | "acting" | "card";
export type Acted = Partial<Record<StopId, number>>;

export interface TourState {
  phase: Phase;
  stopIndex: number;
  stopPhase: StopPhase;
  /** When each moment was played, in seconds (see now()). */
  acted: Acted;
}

export const now = () => performance.now() / 1000;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function since(acted: Acted, id: StopId): number | null {
  const s = acted[id];
  return s == null ? null : now() - s;
}

export function angleLerp(a: number, b: number, t: number) {
  const d = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
}

/** Live character positions, so the cat, coin and crown can follow them. */
export const shared = {
  princess: new THREE.Vector3(-0.45, 0, 14.8),
  prince: new THREE.Vector3(0.45, 0, 14.8),
  princessYaw: Math.PI,
};

