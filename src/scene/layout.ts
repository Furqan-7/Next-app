import type { StopId } from "@/story";

export type V3 = [number, number, number];

export interface StopLayout {
  /** Camera position and the point it looks at. */
  cam: V3;
  look: V3;
  /** Where the two characters stand, and what they look at. */
  princess: V3;
  prince: V3;
  face: V3;
  /** Where they move to once the moment has played. */
  after?: { princess: V3; prince: V3; faceEachOther?: boolean };
  /** Seconds from tapping the action to the memory card opening. */
  duration: number;
}

export const WALK_SPEED = 3.4;

export const ISLAND_RADIUS = 16.2;
export const WATER_Y = -0.25;
export const BEACH_WIDTH = 2.4;

/** Edge of the raised grass plateau at angle a (radians, atan2(z, x)). */
export function plateauRadius(a: number) {
  return ISLAND_RADIUS + 0.35 * Math.sin(3 * a + 1.3) + 0.25 * Math.sin(7 * a);
}

/** Edge of the sandy beach (where the water starts) at angle a. Mirrored in the water shader. */
export function beachRadius(a: number) {
  return ISLAND_RADIUS + BEACH_WIDTH + 0.9 * Math.sin(3 * a + 2.0) + 0.5 * Math.sin(5 * a + 0.7);
}

export const layout: Record<StopId, StopLayout> = {
  gates: {
    cam: [0.6, 2.6, 19.6],
    look: [0, 1.5, 12.8],
    princess: [-0.45, 0, 14.8],
    prince: [0.45, 0, 14.8],
    face: [0, 1, 12.5],
    after: { princess: [-0.45, 0, 10.6], prince: [0.45, 0, 10.6] },
    duration: 2.6,
  },
  roses: {
    cam: [-1.2, 3.3, 4.6],
    look: [-6.4, 1, 8.6],
    princess: [-6.1, 0, 8.8],
    prince: [-5.2, 0, 9.4],
    face: [-7.6, 0.5, 8.4],
    duration: 2.0,
  },

  tea: {
    cam: [-6.0, 3.4, 4.4],
    look: [-11, 1, 1.6],
    // Seated on the two chairs either side of the table.
    princess: [-12.1, 0.1, 1.5],
    prince: [-9.9, 0.1, 1.5],
    face: [-11, 0.8, 1.5],
    duration: 2.4,
  },
  dragon: {
    cam: [-3.6, 3, 0.4],
    look: [-9.2, 1, -5.6],
    princess: [-10.7, 0, -5.1],
    prince: [-11.0, 0, -4.2],
    face: [-9, 0.6, -6.5],
    duration: 2.6,
  },

  well: {
    cam: [11.5, 3, 9.6],
    look: [6.6, 1, 8.8],
    princess: [5.8, 0, 9.3],
    prince: [6.0, 0, 10.3],
    face: [7, 0.6, 8.2],
    duration: 2.4,
  },

  swan: {
    cam: [15, 4.6, 11],
    look: [21.4, 0.5, 3.2],
    princess: [20.1, 0.3, 2.3],
    prince: [20.9, 0.3, 1.8],
    face: [21.2, 0.3, 3.6],
    duration: 7.6,
  },
  easel: {
    cam: [13.4, 3, -0.6],
    look: [9.8, 1.4, -4.8],
    princess: [8.7, 0, -4.3],
    prince: [9.0, 0, -3.3],
    face: [10.2, 1.4, -5],
    duration: 2.8,
  },

  gazebo: {
    cam: [0.4, 3.6, 8.8],
    look: [4.8, 1.4, 1.8],
    princess: [4.2, 0.3, 2.6],
    prince: [5.5, 0.3, 2.4],
    face: [4.8, 1, 1.6],
    after: {
      princess: [4.55, 0.3, 1.95],
      prince: [5.1, 0.3, 1.95],
      faceEachOther: true,
    },
    duration: 3.0,
  },
  castle: {
    cam: [0, 2.6, 6.2],
    look: [0, 5.2, -10.5],
    princess: [-0.45, 0, -1.0],
    prince: [0.45, 0, -1.0],
    face: [0, 3, -11.5],
    duration: 2.6,
  },
  throne: {
    cam: [-1.2, 2.5, 0.2],
    look: [0, 1.6, -5.4],
    princess: [0, 0.4, -5.7],
    prince: [1.25, 0, -4.4],
    face: [0, 1, 0],
    duration: 2.4,
  },

};

export const FINALE = {
  cam: [0, 2.6, 5] as V3,
  look: [0, 10, -11] as V3,
  princess: [-0.4, 0, -2.6] as V3,
  prince: [0.4, 0, -2.6] as V3,
  face: [0, 3, -11.5] as V3,
};

/** The swan boat's lap of the lake, as a function of seconds since "Ride the swan boat". */
export const RIDE = { board: 0.35, start: 0.7, length: 6.0, end: 6.9 };
const BOAT_CENTER = { x: 25.2, z: 3.6 };
const BOAT_RADIUS = 4;

export function boatPose(e: number | null, t: number) {
  let s = 0;
  if (e != null) s = Math.min(1, Math.max(0, (e - RIDE.start) / RIDE.length));
  const k = s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2;
  const theta = Math.PI + Math.PI * 2 * k;
  return {
    x: BOAT_CENTER.x + BOAT_RADIUS * Math.cos(theta),
    y: WATER_Y + 0.05 + Math.sin(t * 1.8) * 0.04,
    z: BOAT_CENTER.z + BOAT_RADIUS * Math.sin(theta),
    yaw: Math.atan2(-Math.sin(theta), Math.cos(theta)),
  };
}
