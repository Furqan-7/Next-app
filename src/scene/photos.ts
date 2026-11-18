"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

/** Crop a texture like CSS object-fit: cover, for a frame of the given width / height. */
function cover(tex: THREE.Texture, aspect: number) {
  const img = tex.image as { width: number; height: number };
  const ia = img.width / img.height;
  if (ia > aspect) {
    tex.repeat.set(aspect / ia, 1);
    tex.offset.set((1 - aspect / ia) / 2, 0);
  } else {
    tex.repeat.set(1, ia / aspect);
    tex.offset.set(0, (1 - ia / aspect) / 2);
  }
}

/** Loads a photo as a texture cropped to fit; null until it has loaded (or if url is empty). */
export function usePhotoTexture(url: string | null | undefined, aspect: number) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    new THREE.TextureLoader().load(
      url,
      (t) => {
        if (!alive) return;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        cover(t, aspect);
        setTex(t);
      },
      undefined,
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [url, aspect]);
  return tex;
}
