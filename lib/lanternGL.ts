/**
 * The fanous that paints the tent with light.
 *
 * A pierced brass lantern hangs in a dark room. Its light passes through the
 * holes (stars, drops, rings — some through coloured glass) and lands on the
 * walls, ceiling and floor. Each light spot is traced in 3D: a ray from the
 * lantern through its hole, hit against the room's box, then projected through
 * a perspective camera — so spots on the floor shrink toward the back and
 * stretch apart near you, exactly like the real thing.
 *
 * Scroll and every spot leaves its wall and flies in to write سمسم in light.
 *
 * CPU does the ray math (a few thousand spots, trivial), the GPU draws them as
 * additive soft points. One draw call per frame, only while on screen.
 */

const VERT = `
attribute vec2 aPos;
attribute float aSize;
attribute vec4 aCol;
varying vec4 vCol;
void main() {
  vCol = aCol;
  gl_PointSize = aSize;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying vec4 vCol;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(clamp(1.0 - r, 0.0, 1.0), 1.6) * vCol.a;
  gl_FragColor = vec4(vCol.rgb * a, a);
}
`;

type V3 = [number, number, number];

interface Spot {
  th: number; // azimuth around the lantern
  ph: number; // elevation
  r: number; // hole size (radians)
  col: V3;
  tx: number; // target in NDC (the name)
  ty: number;
  delay: number;
  twinkle: number;
  hole: boolean; // a real perforation (filler spots only exist to write the name)
}

export interface LanternState {
  intro: number; // 0 → 1 as the lantern is lit
  form: number; // 0 → 1 as the light writes the name
  swayX: number; // lantern tilt, radians
  swayZ: number;
  spin: number; // rotation of the lantern, radians
  calm: boolean;
}

export interface LanternRenderer {
  render: (s: LanternState, time: number) => { lx: number; ly: number };
  destroy: () => void;
}

const LANTERN: V3 = [0, 0.95, -4.2];
const ROOM = { x: 6.5, floor: -2.1, ceil: 3.4, back: -13, front: 1.5 };
const FOV = (58 * Math.PI) / 180;

const CREAM: V3 = [1.0, 0.82, 0.55];
const AMBER: V3 = [1.0, 0.6, 0.22];
const GLASS: V3[] = [
  [1.0, 0.28, 0.22],
  [0.2, 0.85, 0.75],
  [0.45, 0.9, 0.35],
  [0.3, 0.5, 1.0],
];

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** The lantern's perforations: bands of shaped holes, laid out in spherical coordinates. */
function buildHoles(count: number): Spot[] {
  const rand = rng(11);
  const spots: Spot[] = [];
  const bands = [-62, -44, -28, -14, -2, 11, 25, 41, 58];
  const shapes = ["star", "drop", "dot", "star", "ring", "drop", "star", "dot", "ring"] as const;
  let budget = count;
  for (let b = 0; b < bands.length && budget > 0; b++) {
    const ph = (bands[b]! * Math.PI) / 180;
    const holes = Math.max(8, Math.round(26 * Math.cos(ph)));
    const glass = b % 3 === 1;
    for (let k = 0; k < holes; k++) {
      const th = (k / holes) * Math.PI * 2 + b * 0.37;
      const col = glass ? GLASS[(k + b) % GLASS.length]! : k % 2 ? CREAM : AMBER;
      const shape = shapes[b]!;
      const pts: Array<[number, number, number]> = [];
      const R = 0.028;
      if (shape === "star") {
        pts.push([0, 0, 1.4]);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const rr = i % 2 ? R * 0.55 : R;
          pts.push([Math.cos(a) * rr, Math.sin(a) * rr, 0.8]);
        }
      } else if (shape === "drop") {
        pts.push([0, -R * 0.7, 1.2], [0, 0, 0.9], [0, R * 0.6, 0.65], [0, R * 1.05, 0.45]);
      } else if (shape === "ring") {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          pts.push([Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, 0.7]);
        }
      } else {
        pts.push([0, 0, 1.6]);
      }
      for (const [dx, dy, sz] of pts) {
        if (budget-- <= 0) break;
        spots.push({
          hole: true,
          th: th + dx / Math.max(0.3, Math.cos(ph)),
          ph: ph + dy,
          r: sz,
          col,
          tx: 0,
          ty: 0,
          delay: 0,
          twinkle: rand() * Math.PI * 2,
        });
      }
    }
  }
  // fill to the requested count with fine scatter (light leaking through the filigree)
  while (spots.length < count) {
    const ph = (rand() * 2 - 1) * 1.15;
    spots.push({ hole: false, th: rand() * Math.PI * 2, ph, r: 0.35 + rand() * 0.4, col: rand() < 0.2 ? GLASS[Math.floor(rand() * 4)]! : CREAM, tx: 0, ty: 0, delay: 0, twinkle: rand() * 6.28 });
  }
  return spots;
}

/** Sample the name in the display face into target points (NDC). */
async function nameTargets(spots: Spot[], aspect: number, fontFamily: string, mobile: boolean) {
  const W = 900;
  const H = Math.round(W / aspect);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  let fs = Math.round(Math.min(W * (mobile ? 0.7 : 0.42), H * 0.5));
  try {
    await document.fonts.load(`700 ${fs}px ${fontFamily}`, "سمسم");
  } catch {
    /* use what is loaded */
  }
  g.font = `700 ${fs}px ${fontFamily}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.direction = "rtl";
  g.fillStyle = "#fff";
  // Ruq'ah swashes reach far below the baseline: fit and centre the actual ink
  let m = g.measureText("سمسم");
  const fit = Math.min(
    1,
    (W * (mobile ? 0.86 : 0.5)) / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight),
    (H * 0.5) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent),
  );
  fs = Math.floor(fs * fit);
  g.font = `700 ${fs}px ${fontFamily}`;
  m = g.measureText("سمسم");
  const cy = H * (mobile ? 0.4 : 0.38) + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  const cx = W / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
  g.fillText("سمسم", cx, cy);
  const data = g.getImageData(0, 0, W, H).data;
  const pts: Array<[number, number]> = [];
  const step = mobile ? 3 : 2;
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (data[(y * W + x) * 4 + 3]! > 140) pts.push([x, y]);
  const rand = rng(5);
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pts[i], pts[j]] = [pts[j]!, pts[i]!];
  }
  spots.forEach((s, i) => {
    const p = pts[i % Math.max(1, pts.length)] ?? [cx, cy];
    s.tx = (p[0] / W) * 2 - 1;
    s.ty = 1 - (p[1] / H) * 2;
    // the name is written from right to left: spots bound for the right edge leave first
    s.delay = (1 - (s.tx + 1) / 2) * 0.45 + rand() * 0.12;
  });
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}

/** The fanous itself, as points in lantern units (height about 1, origin at its centre). */
function buildLantern(): Array<{ x: number; y: number; size: number; col: V3; a: number; glass: boolean }> {
  const out: Array<{ x: number; y: number; size: number; col: V3; a: number; glass: boolean }> = [];
  const brass: V3 = [0.95, 0.68, 0.34];
  const line = (x0: number, y0: number, x1: number, y1: number, n: number, size = 2.4) => {
    n *= 2;
    for (let i = 0; i <= n; i++) out.push({ x: x0 + ((x1 - x0) * i) / n, y: y0 + ((y1 - y0) * i) / n, size, col: brass, a: 0.9, glass: false });
  };
  // hanging ring
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    out.push({ x: Math.cos(a) * 0.045, y: -0.6 + Math.sin(a) * 0.045, size: 1.5, col: brass, a: 0.9, glass: false });
  }
  // dome
  for (let i = 0; i <= 28; i++) {
    const u = i / 28;
    out.push({ x: -0.24 + 0.48 * u, y: -0.34 - 0.21 * Math.sin(u * Math.PI) ** 1.4, size: 2.6, col: brass, a: 1, glass: false });
  }
  line(-0.27, -0.34, 0.27, -0.34, 24, 2);
  // pierced crown band
  for (let i = 0; i < 9; i++) out.push({ x: -0.2 + i * 0.05, y: -0.4, size: 2.6, col: [1, 0.85, 0.55], a: 0.9, glass: true });
  // body frame and panel posts
  line(-0.24, -0.34, -0.22, 0.24, 30);
  line(0.24, -0.34, 0.22, 0.24, 30);
  line(-0.08, -0.34, -0.075, 0.24, 30, 1.3);
  line(0.08, -0.34, 0.075, 0.24, 30, 1.3);
  line(-0.22, 0.24, 0.22, 0.24, 22, 2);
  // base
  line(-0.22, 0.24, -0.13, 0.36, 8);
  line(0.22, 0.24, 0.13, 0.36, 8);
  line(-0.13, 0.36, 0.13, 0.36, 12, 2);
  // glass panes lit from inside: teal, cream, red, each with a pointed-arch window
  const panes: Array<[number, number, V3]> = [
    [-0.225, -0.085, [0.2, 0.85, 0.78]],
    [-0.07, 0.07, [1.0, 0.86, 0.6]],
    [0.085, 0.215, [1.0, 0.3, 0.26]],
  ];
  for (const [x0, x1, col] of panes) {
    const cxp = (x0 + x1) / 2;
    for (let y = -0.31; y < 0.22; y += 0.035) {
      for (let x = x0 + 0.02; x < x1 - 0.01; x += 0.035) {
        const inArch = Math.abs(x - cxp) < 0.045 * (y < -0.18 ? Math.max(0, (y + 0.31) / 0.13) : 1);
        out.push({ x, y, size: inArch ? 5 : 3.6, col, a: inArch ? 1 : 0.6, glass: true });
      }
    }
  }
  return out;
}

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export async function createLanternRenderer(
  canvas: HTMLCanvasElement,
  opts: { fontFamily: string },
): Promise<LanternRenderer | null> {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const prog = gl.createProgram()!;
  try {
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  } catch {
    return null;
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // light adds up

  const mobile = canvas.clientWidth < 720;
  const N = mobile ? 1700 : 3000;
  const lanternPts = buildLantern();
  const CHAIN = 40;
  const EXTRA = 2 + lanternPts.length + CHAIN; // halo + core + lantern + chain
  const spots = buildHoles(N);
  const STRIDE = 7; // x y size r g b a
  const data = new Float32Array((N + EXTRA) * STRIDE);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  const aSize = gl.getAttribLocation(prog, "aSize");
  const aCol = gl.getAttribLocation(prog, "aCol");
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aSize);
  gl.enableVertexAttribArray(aCol);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, STRIDE * 4, 0);
  gl.vertexAttribPointer(aSize, 1, gl.FLOAT, false, STRIDE * 4, 8);
  gl.vertexAttribPointer(aCol, 4, gl.FLOAT, false, STRIDE * 4, 12);
  const maxPoint = (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array)[1] ?? 64;

  let aspect = 1;
  let dpr = 1;
  let targetsFor = "";
  const resize = async () => {
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.25);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = w / Math.max(1, h);
    const key = `${Math.round(aspect * 100)}`;
    if (key !== targetsFor) {
      targetsFor = key;
      await nameTargets(spots, aspect, opts.fontFamily, mobile);
    }
  };
  await resize();
  const ro = new ResizeObserver(() => void resize());
  ro.observe(canvas);

  const f = 1 / Math.tan(FOV / 2);
  const project = (x: number, y: number, z: number): [number, number, number] => {
    const d = -z;
    return [(f * x) / (d * aspect), (f * y) / d, d];
  };

  return {
    render(s, time) {
      const H = canvas.height;
      const [lx, ly] = project(LANTERN[0], LANTERN[1], LANTERN[2]);
      const cx = Math.cos(s.swayX), sx = Math.sin(s.swayX);
      const cz = Math.cos(s.swayZ), sz = Math.sin(s.swayZ);
      let o = 0;
      for (let i = 0; i < N; i++) {
        const sp = spots[i]!;
        // direction out of the lantern through this hole, turned with the lantern and its swing
        const th = sp.th + s.spin;
        const cp = Math.cos(sp.ph);
        let dx = cp * Math.cos(th);
        let dy = Math.sin(sp.ph);
        let dz = cp * Math.sin(th);
        // tilt (pendulum): around x, then around z
        const ty = dy * cx - dz * sx;
        dz = dy * sx + dz * cx;
        dy = ty;
        const tx = dx * cz - dy * sz;
        dy = dx * sz + dy * cz;
        dx = tx;
        // nearest wall of the room along that ray
        let t = 1e9;
        if (dx > 1e-4) t = Math.min(t, (ROOM.x - LANTERN[0]) / dx);
        if (dx < -1e-4) t = Math.min(t, (-ROOM.x - LANTERN[0]) / dx);
        if (dy > 1e-4) t = Math.min(t, (ROOM.ceil - LANTERN[1]) / dy);
        if (dy < -1e-4) t = Math.min(t, (ROOM.floor - LANTERN[1]) / dy);
        if (dz < -1e-4) t = Math.min(t, (ROOM.back - LANTERN[2]) / dz);
        if (dz > 1e-4) t = Math.min(t, (ROOM.front - LANTERN[2]) / dz);
        const px = LANTERN[0] + dx * t;
        const py = LANTERN[1] + dy * t;
        const pz = LANTERN[2] + dz * t;
        let wx = lx, wy = ly, size = 0, alpha = 0;
        if (pz < -1.6 && sp.hole) {
          const [nx, ny, depth] = project(px, py, pz);
          // spot size grows with throw distance, shrinks with distance from the eye
          size = Math.min(H * 0.06, (sp.r * 0.03 * t * H) / depth);
          alpha = Math.min(1, 2.6 / (1 + t * 0.2)) * 0.9;
          // the lantern is being lit: light spreads outward from it
          const reach = gaussianStep(s.intro * 1.25 - i / N * 0.25);
          wx = lx + (nx - lx) * reach;
          wy = ly + (ny - ly) * reach;
          alpha *= Math.min(1, s.intro * 1.5);
        }
        // writing the name
        const k = ease((s.form - sp.delay) / 0.5);
        let r = sp.col[0], g = sp.col[1], b = sp.col[2];
        if (k > 0) {
          const arc = Math.sin(k * Math.PI) * 0.18;
          wx = wx + (sp.tx - wx) * k;
          wy = wy + (sp.ty - wy) * k + arc;
          const tw = s.calm ? 1 : 0.75 + 0.25 * Math.sin(time * 3 + sp.twinkle);
          const nameSize = (mobile ? 4.2 : 5.2) * dpr * tw;
          size = size + (nameSize - size) * k;
          alpha = alpha + (0.8 - alpha) * k;
          r += (1.0 - r) * k;
          g += (0.84 - g) * k;
          b += (0.58 - b) * k;
        }
        data[o++] = wx;
        data[o++] = wy;
        data[o++] = Math.min(maxPoint, Math.max(0, size));
        data[o++] = r;
        data[o++] = g;
        data[o++] = b;
        data[o++] = alpha;
      }
      // the flame itself, and its halo
      const flick = s.calm ? 1 : 0.9 + 0.06 * Math.sin(time * 9) + 0.04 * Math.sin(time * 23);
      const lit = Math.min(1, s.intro * 3) * (1 - s.form * 0.85);
      // the lantern body swings about its hanging ring
      const scale = H * (mobile ? 0.22 : 0.3);
      const W = canvas.width;
      const ang = -s.swayZ * 1.1;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const pivotY = -0.6;
      const toNdc = (x: number, y: number): [number, number] => {
        const ry = y - pivotY;
        const xr = x * ca - ry * sa;
        const yr = x * sa + ry * ca + pivotY;
        return [lx + (xr * scale * 2) / W, ly - (yr * scale * 2) / H];
      };
      const shown = Math.min(1, s.intro * 2.5) * (1 - s.form);
      for (const p of lanternPts) {
        const [x, y] = toNdc(p.x, p.y);
        data[o++] = x;
        data[o++] = y;
        data[o++] = p.size * dpr * (p.glass ? flick : 1);
        data[o++] = p.col[0];
        data[o++] = p.col[1];
        data[o++] = p.col[2];
        data[o++] = p.a * shown * (p.glass ? Math.min(1, s.intro * 1.6) * flick : 1);
      }
      // chain: from the top of the screen down to the ring
      const [rx, ry] = toNdc(0, -0.645);
      for (let i = 0; i < CHAIN; i++) {
        const u = i / (CHAIN - 1);
        data[o++] = rx * u + lx * (1 - u);
        data[o++] = 1 + (ry - 1) * u;
        data[o++] = 1.4 * dpr;
        data[o++] = 0.8;
        data[o++] = 0.58;
        data[o++] = 0.3;
        data[o++] = 0.55 * shown * (0.4 + 0.6 * u);
      }
      for (const [sz, a] of [
        [0.5 * H, 0.18],
        [0.05 * H, 0.9],
      ] as const) {
        data[o++] = lx;
        data[o++] = ly;
        data[o++] = Math.min(maxPoint, sz * flick);
        data[o++] = 1.0;
        data[o++] = 0.7;
        data[o++] = 0.35;
        data[o++] = a * lit;
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      gl.drawArrays(gl.POINTS, 0, N + EXTRA);
      return { lx, ly };
    },
    destroy() {
      ro.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
  };
}

function gaussianStep(x: number) {
  return x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);
}
