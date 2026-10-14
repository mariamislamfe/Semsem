/* eslint-disable react-hooks/immutability -- the three.js scene graph is an imperative external system: camera, lights and fog are mutated per frame by design */
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";

/**
 * Semsem, as one continuous camera shot.
 *
 *   street  →  the tent's closed door  →  flaps part  →  walk the hall under the
 *   lanterns  →  lower yourself onto the table  →  look straight down at the cloth.
 *
 * The scene is deliberately small: a lane, a facade, one long hall, a few tables
 * and a hero table. Everything is lit by a handful of real lights; glow is faked
 * with additive sprites. Nothing renders while it is off screen.
 *
 * ⚠ CONCEPTUAL: this is an invented interpretation of a Ramadan tent entrance,
 * not a reconstruction of the real Semsem venue. Replace with the venue's own
 * references/photography when available.
 */

type V3 = [number, number, number];
export type Quality = "high" | "low";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A flat four-cornered surface with UVs that repeat `ru × rv` times. */
function quad(a: V3, b: V3, c: V3, d: V3, ru = 1, rv = 1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c, ...a, ...c, ...d]), 3),
  );
  g.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array([0, 0, ru, 0, ru, rv, 0, 0, ru, rv, 0, rv]), 2),
  );
  g.computeVertexNormals();
  return g;
}

// ───────────────────────── shared assets ─────────────────────────

const TILE = 3.4; // metres of world per 4×4 pattern canvas

function useClothTexture() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      const g = c.getContext("2d");
      if (!g) return;
      for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) g.drawImage(img, x * 256, y * 256, 256, 256);
      if (alive) setCanvas(c);
    };
    img.src = "/patterns/khayameya.svg";
    return () => {
      alive = false;
    };
  }, []);
  return useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [canvas]);
}

function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,214,140,1)");
    grd.addColorStop(0.25, "rgba(255,160,70,.55)");
    grd.addColorStop(1, "rgba(255,120,30,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

const DISHES = {
  ful: "/images/ful.webp",
  falafel: "/images/falafel.webp",
  baba: "/images/baba.webp",
  fries: "/images/fries.webp",
  fulBowl: "/images/ful-bowl.webp",
  grilled: "/images/eggplant-grilled.webp",
  dip: "/images/falafel-dip.webp",
  salad: "/images/salad.webp",
  tea: "/images/mint-tea.webp",
} as const;
type DishKey = keyof typeof DISHES;

/** Small optimised versions via the Next image endpoint — keeps GPU memory low. */
function useDishTextures() {
  const [tex, setTex] = useState<Partial<Record<DishKey, THREE.Texture>>>({});
  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    (Object.keys(DISHES) as DishKey[]).forEach((k) => {
      loader.load(`/_next/image?url=${encodeURIComponent(DISHES[k])}&w=384&q=75`, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        if (alive) setTex((prev) => ({ ...prev, [k]: t }));
      });
    });
    return () => {
      alive = false;
    };
  }, []);
  return tex;
}

const DishCtx = createContext<Partial<Record<DishKey, THREE.Texture>>>({});

interface Shared {
  /** smoothed scroll progress */
  p: number;
  /** how hard the camera is moving — lanterns sway with it */
  wind: number;
}

// ───────────────────────── camera path ─────────────────────────

const KEYS: Array<{ p: number; pos: V3; look: V3 }> = [
  { p: 0.0, pos: [0, 1.7, 38], look: [0, 3.2, 0] },
  { p: 0.2, pos: [0, 1.7, 19], look: [0, 2.7, 0] },
  { p: 0.34, pos: [0, 1.7, 7.5], look: [0, 2.4, -2] },
  { p: 0.46, pos: [0, 1.7, 0.6], look: [0, 2.3, -10] },
  { p: 0.62, pos: [0, 1.65, -10], look: [0, 2.2, -22] },
  { p: 0.76, pos: [0, 1.55, -17.5], look: [0, 1.0, -24] },
  { p: 0.88, pos: [0, 3.7, -22.4], look: [0, 0.6, -24] },
  { p: 1.0, pos: [0, 6.4, -24], look: [0, 0, -24] },
];

function Rig({ progress, shared }: { progress: MotionValue<number>; shared: Shared }) {
  const { camera, pointer, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const curves = useMemo(
    () => ({
      pos: new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal"),
      look: new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.look)), false, "centripetal"),
    }),
    [],
  );
  const tmp = useMemo(() => ({ look: new THREE.Vector3(), up: new THREE.Vector3(), a: new THREE.Vector3() }), []);

  useEffect(() => {
    cam.fov = size.width / size.height < 0.8 ? 72 : 56;
    cam.updateProjectionMatrix();
  }, [cam, size.width, size.height]);

  useFrame((_, dt) => {
    const target = progress.get();
    const prev = shared.p;
    shared.p += (target - prev) * (1 - Math.exp(-dt * 5.5));
    const p = clamp01(shared.p);
    shared.wind = lerp(shared.wind, clamp01(Math.abs(p - prev) / Math.max(dt, 0.001) * 5), 0.08);

    // piecewise-linear p → curve parameter
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1]!.p) i++;
    const k0 = KEYS[i]!;
    const k1 = KEYS[i + 1]!;
    const f = clamp01((p - k0.p) / (k1.p - k0.p));
    const u = (i + f) / (KEYS.length - 1);

    curves.pos.getPoint(u, cam.position);
    curves.look.getPoint(u, tmp.look);

    // a walking step while inside the hall, none when looking straight down
    const walk = smooth(0.4, 0.5, p) * (1 - smooth(0.78, 0.88, p));
    cam.position.y += Math.sin(p * 260) * 0.035 * walk;
    cam.position.x += Math.sin(p * 130) * 0.04 * walk;

    // narrow screens: rise higher at the end so the whole table still fits the width
    const aspect = size.width / size.height;
    const fit = Math.max(1, 3.3 / (Math.tan((cam.fov * Math.PI) / 360) * aspect) / 6.4);
    cam.position.y *= lerp(1, fit, smooth(0.8, 1, p));

    const down = smooth(0.84, 0.97, p);
    tmp.up.set(0, 1 - down, -down).normalize();
    cam.up.copy(tmp.up);
    cam.lookAt(tmp.look);

    // the head turns a little toward where you point
    const free = 1 - down;
    cam.rotateY(-pointer.x * 0.07 * free);
    cam.rotateX(pointer.y * 0.04 * free);
  });
  return null;
}

// ───────────────────────── atmosphere & lights ─────────────────────────

const NIGHT = new THREE.Color("#06070b");
const WARM = new THREE.Color("#1d1009");

function Atmosphere({ shared, quality }: { shared: Shared; quality: Quality }) {
  const { scene, camera, pointer } = useThree();
  const amb = useRef<THREE.AmbientLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);
  const lantern = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Sprite>(null);
  const glow = useGlowTexture();
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), c: new THREE.Color() }), []);

  useFrame((state) => {
    const p = shared.p;
    const inside = smooth(0.3, 0.46, p);
    const fog = scene.fog as THREE.FogExp2;
    tmp.c.copy(NIGHT).lerp(WARM, inside);
    fog.color.copy(tmp.c);
    (scene.background as THREE.Color).copy(tmp.c);
    fog.density = lerp(0.034, 0.024, inside);
    if (amb.current) {
      amb.current.intensity = lerp(0.35, 0.32, inside);
    }
    if (moon.current) moon.current.intensity = lerp(0.55, 0.06, inside);

    // the lantern you carry: follows the pointer across the facade, idles on its own
    const t = state.clock.elapsedTime;
    const idle = Math.hypot(pointer.x, pointer.y) < 0.001;
    const nx = idle ? Math.sin(t * 0.42) * 0.55 : pointer.x;
    const ny = idle ? 0.1 + Math.sin(t * 0.67 + 1) * 0.3 : pointer.y;
    // map the pointer straight onto the facade, so wherever you point, the light lands on the cloth
    if (lantern.current && flame.current) {
      const on = camera.position.z > 2.5 ? 1 - smooth(0.22, 0.4, p) : 0;
      tmp.v.set(clamp01((nx + 1) / 2) * 12.4 - 6.2, 0.6 + clamp01((ny + 1) / 2) * 5.4, 1.3);
      lantern.current.position.copy(tmp.v);
      flame.current.position.copy(tmp.v);
      lantern.current.intensity = 55 * on * (0.94 + Math.sin(t * 11) * 0.06);
      (flame.current.material as THREE.SpriteMaterial).opacity = 0.9 * on;
    }
  });

  return (
    <>
      <ambientLight ref={amb} color="#7a86b4" intensity={0.35} />
      <directionalLight ref={moon} color="#7f95c9" intensity={0.55} position={[-8, 14, 16]} />
      <pointLight ref={lantern} color="#ffae55" intensity={0} distance={16} decay={2} />
      <sprite ref={flame} scale={[2.6, 2.6, 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} transparent fog={false} />
      </sprite>
      {/* the hall's own lights */}
      {[-3, -11, -19, -27].slice(0, quality === "high" ? 4 : 3).map((z, i) => (
        <pointLight key={z} color="#ff9d4d" intensity={26} distance={11} decay={2} position={[i % 2 ? 2.2 : -2.2, 4.4, z]} />
      ))}
      <pointLight color="#ffb064" intensity={30} distance={12} decay={2} position={[0, 3.2, -1.4]} />
      <pointLight color="#ffc27a" intensity={55} distance={13} decay={2} position={[0, 4.2, -24]} />
    </>
  );
}

// ───────────────────────── the lane ─────────────────────────

function Street({ quality }: { quality: Quality }) {
  const rand = useMemo(() => rng(7), []);
  const buildings = useMemo(() => {
    const out: Array<{ x: number; z: number; w: number; h: number; d: number }> = [];
    for (const side of [-1, 1]) {
      for (let z = 4; z < 46; z += 6.2) {
        const w = 5 + rand() * 3;
        const h = 6.5 + rand() * 6;
        out.push({ x: side * (7.4 + w / 2), z, w, h, d: 5.6 });
      }
    }
    return out;
  }, [rand]);

  const windows = useMemo(() => {
    const r = rng(21);
    const out: Array<{ pos: V3; rot: number }> = [];
    buildings.forEach((b) => {
      const side = Math.sign(b.x);
      for (let k = 0; k < (quality === "high" ? 6 : 3); k++) {
        if (r() > 0.4) continue;
        out.push({
          pos: [b.x - side * (b.w / 2 + 0.01), 2 + r() * (b.h - 3), b.z + (r() - 0.5) * (b.d - 1.2)],
          rot: side > 0 ? -Math.PI / 2 : Math.PI / 2,
        });
      }
    });
    return out;
  }, [buildings, quality]);

  // paper flags strung across the lane — the Ramadan alley
  const strings = useMemo(() => (quality === "high" ? [34, 28, 22, 16, 10, 5] : [30, 20, 11]), [quality]);
  const flagCount = 26;
  const flags = useRef<THREE.InstancedMesh>(null);
  const flagGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-0.26, 0, 0, 0.26, 0, 0, 0, -0.6, 0]), 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const ropes = useMemo(() => {
    return strings.map((z) => {
      const pts: THREE.Vector3[] = [];
      // catenary-ish: high at the walls, lowest in the middle
      for (let i = 0; i <= 28; i++) {
        const x = lerp(-7.2, 7.2, i / 28);
        pts.push(new THREE.Vector3(x, 6.9 - 1.1 * (1 - Math.pow(x / 7.2, 2)), z));
      }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: "#3a302a" }));
    });
  }, [strings]);

  useLayoutEffect(() => {
    const m = flags.current;
    if (!m) return;
    const palette = ["#a8281f", "#e0a33a", "#4f8a3c", "#d8cfbb", "#2a6aa8"].map((c) => new THREE.Color(c).multiplyScalar(0.62));
    const r = rng(99);
    const o = new THREE.Object3D();
    let n = 0;
    strings.forEach((z) => {
      for (let i = 0; i < flagCount; i++) {
        const x = lerp(-7, 7, (i + 0.5) / flagCount);
        const y = 6.9 - 1.1 * (1 - Math.pow(x / 7.2, 2)) - 0.04;
        o.position.set(x, y, z);
        o.rotation.set(0, (r() - 0.5) * 0.3, (r() - 0.5) * 0.18);
        o.updateMatrix();
        m.setMatrixAt(n, o.matrix);
        m.setColorAt(n, palette[(i + Math.floor(r() * 3)) % palette.length]!);
        n++;
      }
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [strings]);

  // a few hanging fanous on the lane's centre line
  const laneLanterns: V3[] = quality === "high" ? [[0, 4.4, 30], [0, 4.4, 21], [0, 4.4, 13], [0, 4.4, 7]] : [[0, 4.4, 24], [0, 4.4, 12]];

  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 10]}>
        <planeGeometry args={[80, 120]} />
        <meshStandardMaterial color="#171210" roughness={1} />
      </mesh>
      {/* the lane itself — slightly lighter, worn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 20]}>
        <planeGeometry args={[14, 60]} />
        <meshStandardMaterial color="#1f1914" roughness={1} />
      </mesh>

      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color="#0f1118" roughness={1} />
        </mesh>
      ))}
      {windows.map((w, i) => (
        <mesh key={i} position={w.pos} rotation={[0, w.rot, 0]}>
          <planeGeometry args={[0.38, 0.6]} />
          <meshBasicMaterial color="#b8793a" />
        </mesh>
      ))}

      {ropes.map((r, i) => (
        <primitive key={i} object={r} />
      ))}
      <instancedMesh ref={flags} args={[flagGeom, undefined, strings.length * flagCount]} frustumCulled={false}>
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>

      {laneLanterns.map((p, i) => (
        <Fanous key={i} position={p} phase={i * 1.7} shared={null} hang={2.4} />
      ))}

    </group>
  );
}

// ───────────────────────── fanous ─────────────────────────

const fanousGeo = {
  body: new THREE.CylinderGeometry(0.17, 0.21, 0.5, 6),
  cap: new THREE.ConeGeometry(0.22, 0.2, 6),
  base: new THREE.CylinderGeometry(0.2, 0.12, 0.12, 6),
};
const fanousMat = {
  body: new THREE.MeshStandardMaterial({ color: "#2a160c", emissive: new THREE.Color("#ff9a3c"), emissiveIntensity: 1.8, roughness: 0.6 }),
  metal: new THREE.MeshStandardMaterial({ color: "#6b3a1c", roughness: 0.5, metalness: 0.6 }),
};

function Fanous({
  position,
  phase,
  shared,
  hang = 1.2,
}: {
  position: V3;
  phase: number;
  shared: Shared | null;
  hang?: number;
}) {
  const g = useRef<THREE.Group>(null);
  const glow = useGlowTexture();
  useFrame((state) => {
    if (!g.current) return;
    const wind = shared ? shared.wind : 0;
    g.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.3 + phase) * (0.035 + wind * 0.18);
    g.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.9 + phase) * (0.02 + wind * 0.1);
  });
  return (
    <group position={position}>
      {/* the pivot is at the top of the cord, so the whole lantern swings */}
      <group ref={g}>
        <mesh position={[0, hang / 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, hang, 4]} />
          <meshBasicMaterial color="#5a4636" />
        </mesh>
        <group position={[0, -0.3, 0]}>
          <mesh geometry={fanousGeo.body} material={fanousMat.body} />
          <mesh geometry={fanousGeo.cap} material={fanousMat.metal} position={[0, 0.35, 0]} />
          <mesh geometry={fanousGeo.base} material={fanousMat.metal} position={[0, -0.31, 0]} />
          <sprite scale={[2.4, 2.4, 1]}>
            <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.8} />
          </sprite>
        </group>
      </group>
    </group>
  );
}

// ───────────────────────── facade ─────────────────────────

function Facade({ cloth, shared }: { cloth: THREE.Texture | null; shared: Shared }) {
  const W = 6.5; // half width
  const DOOR = 1.4; // half door width
  const H = 6.2;
  const DH = 4.4;
  const g = useMemo(
    () => ({
      left: quad([-W, 0, 0], [-DOOR, 0, 0], [-DOOR, H, 0], [-W, H, 0], (W - DOOR) / TILE, H / TILE),
      right: quad([DOOR, 0, 0], [W, 0, 0], [W, H, 0], [DOOR, H, 0], (W - DOOR) / TILE, H / TILE),
      lintel: quad([-DOOR, DH, 0], [DOOR, DH, 0], [DOOR, H, 0], [-DOOR, H, 0], (DOOR * 2) / TILE, (H - DH) / TILE),
      gable: (() => {
        const s = new THREE.Shape();
        s.moveTo(-W, H);
        s.lineTo(W, H);
        s.lineTo(0, 9);
        s.closePath();
        const sg = new THREE.ShapeGeometry(s);
        const uv = sg.attributes.uv!;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (sg.attributes.position!.getX(i) + W) / TILE, (sg.attributes.position!.getY(i) - H) / TILE);
        return sg;
      })(),
      flap: quad([0, 0, 0], [DOOR, 0, 0], [DOOR, DH, 0], [0, DH, 0], DOOR / TILE, DH / TILE),
    }),
    [],
  );
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const spill = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useGlowTexture();

  useFrame(() => {
    const open = smooth(0.22, 0.4, shared.p);
    const s = lerp(1, 0.16, open);
    if (left.current) left.current.scale.x = s;
    if (right.current) right.current.scale.x = s;
    if (spill.current) spill.current.opacity = 0.25 + open * 0.75;
  });

  const mat = (
    <meshStandardMaterial
      map={cloth ?? undefined}
      emissiveMap={cloth ?? undefined}
      emissive="#ffffff"
      emissiveIntensity={0.06}
      roughness={0.95}
      side={THREE.DoubleSide}
    />
  );
  const trim = <meshStandardMaterial color="#8a5a22" metalness={0.5} roughness={0.5} emissive="#3a2208" />;

  return (
    <group>
      <mesh geometry={g.left}>{mat}</mesh>
      <mesh geometry={g.right}>{mat}</mesh>
      <mesh geometry={g.lintel}>{mat}</mesh>
      <mesh geometry={g.gable}>{mat}</mesh>

      {/* flaps: hinged at the door posts, they bunch toward them as they part */}
      <group ref={left} position={[-DOOR, 0, 0.02]}>
        <mesh geometry={g.flap}>{mat}</mesh>
      </group>
      <group ref={right} position={[DOOR, 0, 0.02]}>
        <mesh geometry={g.flap} position={[-DOOR, 0, 0]}>
          {mat}
        </mesh>
      </group>

      {/* door frame */}
      <mesh position={[-DOOR - 0.06, DH / 2, 0.05]}>
        <boxGeometry args={[0.12, DH, 0.12]} />
        {trim}
      </mesh>
      <mesh position={[DOOR + 0.06, DH / 2, 0.05]}>
        <boxGeometry args={[0.12, DH, 0.12]} />
        {trim}
      </mesh>
      <mesh position={[0, DH + 0.06, 0.05]}>
        <boxGeometry args={[DOOR * 2 + 0.24, 0.12, 0.12]} />
        {trim}
      </mesh>

      {/* warm light spilling out onto the lane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 4.8]}>
        <planeGeometry args={[5.2, 9.6]} />
        <meshBasicMaterial ref={spill} map={glow} color="#ffb462" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

// ───────────────────────── the hall ─────────────────────────

function Hall({ cloth, shared, quality }: { cloth: THREE.Texture | null; shared: Shared; quality: Quality }) {
  const W = 6.5;
  const L = 32;
  const H = 6.2;
  const RIDGE = 9;
  const g = useMemo(() => {
    const roofLen = Math.hypot(W, RIDGE - H);
    return {
      wallL: quad([-W, 0, 0], [-W, 0, -L], [-W, H, -L], [-W, H, 0], L / TILE, H / TILE),
      wallR: quad([W, 0, -L], [W, 0, 0], [W, H, 0], [W, H, -L], L / TILE, H / TILE),
      end: quad([W, 0, -L], [-W, 0, -L], [-W, H, -L], [W, H, -L], (W * 2) / TILE, H / TILE),
      endGable: quad([W, H, -L], [-W, H, -L], [0, RIDGE, -L], [0, RIDGE, -L], (W * 2) / TILE, (RIDGE - H) / TILE),
      floor: quad([-W, 0, 0], [W, 0, 0], [W, 0, -L], [-W, 0, -L], (W * 2) / TILE, L / TILE),
      roofL: quad([-W, H, 0], [-W, H, -L], [0, RIDGE, -L], [0, RIDGE, 0], L / TILE, roofLen / TILE),
      roofR: quad([0, RIDGE, 0], [0, RIDGE, -L], [W, H, -L], [W, H, 0], L / TILE, roofLen / TILE),
    };
  }, []);

  const lanterns: Array<{ pos: V3; phase: number }> = useMemo(() => {
    const out: Array<{ pos: V3; phase: number }> = [];
    for (let z = -3, i = 0; z > -30; z -= 3.6, i++) out.push({ pos: [i % 2 ? 2.2 : -2.2, 5.9, z], phase: i * 1.3 });
    return quality === "high" ? out : out.filter((_, i) => i % 2 === 0);
  }, [quality]);

  const wallMat = (
    <meshStandardMaterial map={cloth ?? undefined} emissiveMap={cloth ?? undefined} emissive="#ffffff" emissiveIntensity={0.035} color="#c9a99a" roughness={1} side={THREE.DoubleSide} />
  );

  return (
    <group>
      <mesh geometry={g.wallL}>{wallMat}</mesh>
      <mesh geometry={g.wallR}>{wallMat}</mesh>
      <mesh geometry={g.end}>{wallMat}</mesh>
      <mesh geometry={g.endGable}>{wallMat}</mesh>
      <mesh geometry={g.roofL}>{wallMat}</mesh>
      <mesh geometry={g.roofR}>{wallMat}</mesh>
      <mesh geometry={g.floor}>
        <meshStandardMaterial map={cloth ?? undefined} color="#2c2420" roughness={1} />
      </mesh>

      {/* ridge beam and poles */}
      <mesh position={[0, RIDGE - 0.1, -L / 2]}>
        <boxGeometry args={[0.2, 0.2, L]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.8} />
      </mesh>
      {[-4, -10, -16, -22, -28].flatMap((z) =>
        [-4.2, 4.2].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 3.4, z]}>
            <cylinderGeometry args={[0.09, 0.11, 6.8, 8]} />
            <meshStandardMaterial color="#2a1a10" roughness={0.8} />
          </mesh>
        )),
      )}

      {lanterns.map((l, i) => (
        <Fanous key={i} position={l.pos} phase={l.phase} shared={shared} hang={1.4} />
      ))}
    </group>
  );
}

// ───────────────────────── tables & dishes ─────────────────────────

const plateGeo = new THREE.CircleGeometry(1, 40);
const clothSkirt = (r: number, h: number) => new THREE.CylinderGeometry(r, r * 1.04, h, 40, 1, false);

function Plate({ position, r, tex }: { position: V3; r: number; tex?: THREE.Texture }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={plateGeo} scale={r}>
        <meshStandardMaterial color="#e9e2d3" roughness={0.5} />
      </mesh>
      <mesh geometry={plateGeo} scale={r * 0.84} position={[0, 0, 0.004]}>
        <meshStandardMaterial key={tex ? "photo" : "blank"} map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.28} roughness={0.7} color={tex ? "#ffffff" : "#554433"} />
      </mesh>
    </group>
  );
}

function Glass({ position }: { position: V3 }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.045, 0.036, 0.1, 10]} />
      <meshStandardMaterial color="#8a2f0f" emissive="#b8481c" emissiveIntensity={0.6} roughness={0.2} />
    </mesh>
  );
}

function RoundTable({
  position,
  radius,
  cloth,
  plates,
  plateR,
  ring,
}: {
  position: V3;
  radius: number;
  cloth: THREE.Texture | null;
  plates: Array<DishKey | undefined>;
  plateR: number;
  ring: number;
}) {
  const dish = useContext(DishCtx);
  const skirt = useMemo(() => clothSkirt(radius, 0.72), [radius]);
  const [x, , z] = position;
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={skirt} position={[0, 0.36, 0]}>
        <meshStandardMaterial map={cloth ?? undefined} emissiveMap={cloth ?? undefined} emissive="#fff" emissiveIntensity={0.1} roughness={0.95} />
      </mesh>
      {plates.map((k, i) => {
        const a = (i / plates.length) * Math.PI * 2;
        return <Plate key={i} position={[Math.cos(a) * ring, 0.735, Math.sin(a) * ring]} r={plateR} tex={k ? dish[k] : undefined} />;
      })}
      <Glass position={[0, 0.78, 0]} />
      <Glass position={[radius * 0.18, 0.78, radius * 0.1]} />
    </group>
  );
}

function Tables({ cloth, quality }: { cloth: THREE.Texture | null; quality: Quality }) {
  const rows: Array<[number, number]> = [];
  for (const z of [-7, -12.5, -18]) for (const x of [-3.6, 3.6]) rows.push([x, z]);
  const picks: DishKey[][] = [
    ["ful", "falafel", "fries", "baba"],
    ["fulBowl", "dip", "salad", "grilled"],
    ["falafel", "ful", "baba", "fries"],
  ];
  const list = quality === "high" ? rows : rows.slice(0, 4);
  return (
    <group>
      {list.map(([x, z], i) => (
        <RoundTable key={i} position={[x, 0, z]} radius={0.95} cloth={cloth} plates={picks[i % 3]!} plateR={0.2} ring={0.5} />
      ))}
      {/* the hero table — the one you sit at */}
      <RoundTable
        position={[0, 0, -24]}
        radius={2.3}
        cloth={cloth}
        plates={["ful", "falafel", "baba", "fries", "grilled"]}
        plateR={0.58}
        ring={1.38}
      />
      {/* floor seating at the far end: cloth, cushions, plates */}
      {[-4.4, 4.4].map((x) => (
        <group key={x} position={[x, 0, -29.6]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[1.25, 32]} />
            <meshStandardMaterial map={cloth ?? undefined} color="#8a6a5a" roughness={1} />
          </mesh>
          {[0, 1, 2, 3].map((k) => {
            const a = (k / 4) * Math.PI * 2 + 0.4;
            return (
              <mesh key={k} position={[Math.cos(a) * 1.55, 0.1, Math.sin(a) * 1.55]} rotation={[0, -a, 0]}>
                <boxGeometry args={[0.7, 0.2, 0.7]} />
                <meshStandardMaterial color={["#7a1f15", "#6b7a3e", "#b8792a", "#7a1f15"][k]} roughness={1} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// ───────────────────────── canvas ─────────────────────────

function World({ progress, quality }: { progress: MotionValue<number>; quality: Quality }) {
  const cloth = useClothTexture();
  const dish = useDishTextures();
  const shared = useMemo<Shared>(() => ({ p: 0, wind: 0 }), []);
  return (
    <DishCtx.Provider value={dish}>
      <color attach="background" args={["#06070b"]} />
      <fogExp2 attach="fog" args={["#06070b", 0.034]} />
      <Rig progress={progress} shared={shared} />
      <Atmosphere shared={shared} quality={quality} />
      <Street quality={quality} />
      {cloth && (
        <>
          <Facade cloth={cloth} shared={shared} />
          <Hall cloth={cloth} shared={shared} quality={quality} />
          <Tables cloth={cloth} quality={quality} />
        </>
      )}
    </DishCtx.Provider>
  );
}

export default function TentCanvas({
  progress,
  quality,
  active,
  onReady,
}: {
  progress: MotionValue<number>;
  quality: Quality;
  active: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      className="!absolute inset-0"
      style={{ touchAction: "pan-y" }}
      dpr={[1, quality === "high" ? 1.75 : 1.25]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: quality === "high", powerPreference: "high-performance" }}
      camera={{ fov: 56, near: 0.1, far: 100, position: [0, 1.7, 38] }}
      onCreated={onReady}
    >
      <World progress={progress} quality={quality} />
    </Canvas>
  );
}
