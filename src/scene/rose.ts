import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

function paint(g: THREE.BufferGeometry, color: THREE.Color) {
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    c[i * 3] = color.r;
    c[i * 3 + 1] = color.g;
    c[i * 3 + 2] = color.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return g;
}

/**
 * A rose head about 1 unit across: a tight bud wrapped in three rings of cupped petals
 * that open outwards, with green sepals underneath. Uses vertex colours.
 * Origin at the base of the flower; it opens towards +y.
 */
export function makeRoseGeometry(petal = "#d81f4a") {
  const base = new THREE.Color(petal);
  const inner = base.clone().multiplyScalar(0.72);
  const outer = base.clone().lerp(new THREE.Color("#ff6f8f"), 0.25);
  const parts: THREE.BufferGeometry[] = [];

  // Tight centre bud.
  const bud = new THREE.SphereGeometry(0.17, 14, 10);
  bud.scale(1, 1.35, 1);
  bud.translate(0, 0.36, 0);
  parts.push(paint(bud, inner));

  // Rings of petals: each petal is a curved shell, tilted outwards a bit more each ring.
  const rings = [
    { n: 3, r: 0.1, tilt: 0.25, y: 0.12, size: 0.28, col: inner },
    { n: 5, r: 0.17, tilt: 0.55, y: 0.08, size: 0.34, col: base },
    { n: 6, r: 0.24, tilt: 0.95, y: 0.04, size: 0.38, col: outer },
  ];
  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.n; i++) {
      const g = new THREE.SphereGeometry(ring.size, 12, 8, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.18, Math.PI * 0.62);
      // Shell faces +z; squash its depth so it reads as a cupped petal.
      g.scale(1, 1.15, 0.55);
      g.translate(0, ring.size * 0.55, -ring.size * 0.42);
      g.rotateX(ring.tilt);
      g.translate(0, ring.y, ring.r);
      g.rotateY((i / ring.n) * Math.PI * 2 + ri * 0.6);
      parts.push(paint(g, ring.col));
    }
  });

  // Sepals underneath.
  const green = new THREE.Color("#2f7a3a");
  for (let i = 0; i < 5; i++) {
    const g = new THREE.ConeGeometry(0.07, 0.32, 4);
    g.translate(0, 0.16, 0);
    g.rotateX(2.0);
    g.translate(0, 0.05, 0);
    g.rotateY((i / 5) * Math.PI * 2);
    parts.push(paint(g, green));
  }
  const cup = new THREE.SphereGeometry(0.12, 10, 6, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
  cup.translate(0, 0.08, 0);
  parts.push(paint(cup, green));

  // mergeGeometries needs every part to be indexed (or all not); spheres and cones are indexed.
  const merged = mergeGeometries(parts, false)!;
  merged.computeVertexNormals();
  return merged;
}

/** A simple leaf, lying in the XY plane, pointing up +y. */
export function makeLeafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.22, 0.25, 0, 0.6);
  s.quadraticCurveTo(-0.22, 0.25, 0, 0);
  return new THREE.ShapeGeometry(s, 8);
}
