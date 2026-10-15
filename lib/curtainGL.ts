/**
 * The tent curtain as real cloth, in one WebGL fragment shader.
 *
 * Each panel is a height field of folds (a few harmonics, never a clean sine),
 * lit like velvet: a soft key light from the front, bright sheen where the
 * fold turns away from you, dark valleys between folds. Scrolling gathers the
 * panels toward the sides, so the same cloth bunches into deeper folds — its
 * embroidery and the name سمسم fold with it, because they are sampled through
 * the same cloth coordinate. A pelmet with a gold fringe hangs across the top.
 *
 * Plain WebGL 1, one full-screen triangle, two textures. Off screen, the
 * caller simply stops calling render().
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D uArt;
uniform vec2 uRes;
uniform float uTime;
uniform float uOpen;
uniform float uDrop;
uniform float uRipple;
uniform vec2 uMouse;   // 0..1, top-left origin
uniform float uFolds;  // folds per panel
uniform float uInk;    // the name fading in
uniform float uCalm;   // reduced motion

const float PI = 3.14159265;
const float TOP = 0.085;  // pelmet depth

vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }

// fold profile: a sine with harmonics so no two folds look identical
float prof(float ph, float y, float k) {
  return sin(ph) + 0.32 * sin(2.0 * ph + 1.3 + k) + 0.12 * sin(3.0 * ph + y * 2.2 + k * 2.0);
}
float dprof(float ph, float y, float k) {
  return cos(ph) + 0.64 * cos(2.0 * ph + 1.3 + k) + 0.36 * cos(3.0 * ph + y * 2.2 + k * 2.0);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;
  float A = uRes.x / uRes.y;
  float t = uTime;
  float px = 1.0 / uRes.x;

  // ───── pelmet: a gathered band across the top with scalloped swags and a fringe
  float swags = max(3.0, floor(A * 2.6));
  float sw = fract(p.x * swags);
  float edge = TOP + 0.03 * sin(sw * PI);
  if (p.y < edge + 0.028) {
    float ph = p.x * swags * 9.0 * PI;
    float h = sin(ph) * 0.5 + 0.5;
    float sheen = pow(abs(cos(ph)), 3.0);
    vec3 base = toLin(vec3(0.20, 0.115, 0.065));
    vec3 col = base * (0.45 + 0.55 * h) + base * sheen * 0.9;
    // the swag sags: lighter along its belly, shadow under the rod
    col *= 0.7 + 0.6 * smoothstep(0.0, edge, p.y) * (0.6 + 0.4 * sin(sw * PI));
    col *= smoothstep(0.0, 0.02, p.y) * 0.6 + 0.4;
    // gold braid along the scalloped edge
    float braid = smoothstep(0.006, 0.0, abs(p.y - (edge - 0.008)));
    col = mix(col, toLin(vec3(0.78, 0.6, 0.32)) * (0.7 + 0.3 * sin(p.x * uRes.x * 0.6)), braid);
    float a = step(p.y, edge);
    // fringe: fine gold threads hanging below the edge, swaying slightly
    if (p.y > edge) {
      float sway = sin(t * 1.3 + p.x * 20.0) * 0.002 * (1.0 - uCalm);
      float thread = smoothstep(0.45, 0.0, abs(fract((p.x + sway * (p.y - edge) * 40.0) * uRes.x / 5.0) - 0.5));
      float len = 0.022 + 0.006 * sin(p.x * 300.0);
      float on = step(p.y, edge + len) * thread;
      col = toLin(vec3(0.72, 0.54, 0.27)) * (0.55 + 0.45 * (1.0 - (p.y - edge) / len));
      a = on;
    }
    if (a > 0.01) {
      gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)) * a, a);
      return;
    }
  }

  // ───── panels
  float w = mix(0.503, 0.07, uOpen);
  // the hem swings (more at the bottom), the cloth breathes while closed
  float yy = clamp((p.y - TOP) / (1.0 - TOP), 0.0, 1.0);
  float swing = uDrop * 0.03 * sin(t * 4.2) * yy * yy;
  float breathe = (1.0 - uCalm) * 0.004 * sin(t * 1.05 + yy * 2.0) * (1.0 - uOpen);

  float leftEdge = w + swing + breathe;
  float rightEdge = 1.0 - w + swing - breathe;
  bool left = p.x < leftEdge;
  bool right = p.x > rightEdge;

  if (!left && !right) {
    // the gap: a soft shadow the cloth casts onto the room behind
    float d = min(p.x - leftEdge, rightEdge - p.x) * A;
    float a = 0.55 * exp(-d * 22.0) * smoothstep(0.0, 0.15, uOpen);
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
    return;
  }

  float u = left ? p.x / leftEdge : (1.0 - p.x) / (1.0 - rightEdge); // 0 at the anchor, 1 at the leading edge
  float side = left ? 0.0 : 1.0;
  float gather = 0.503 / (left ? leftEdge : 1.0 - rightEdge); // 1 closed, ~7 open

  // the visitor's touch sends a ripple through the folds
  vec2 m = (p - uMouse) * vec2(A, 1.0);
  float dm = length(m);
  float rip = uRipple * exp(-dm * dm * 9.0) * sin(t * 6.5 - dm * 26.0) * (1.0 - uCalm);

  float ph = u * uFolds * 2.0 * PI + side * 2.1 + rip * 2.2;
  // folds widen a little toward the hem, like real drapes
  ph *= 1.0 - 0.06 * yy;
  float amp = mix(0.78, 1.6, clamp((gather - 1.0) / 2.2, 0.0, 1.0));
  float h = prof(ph, yy, side) * amp;
  float slope = dprof(ph, yy, side) * amp * 1.35 * (left ? 1.0 : -1.0);

  vec3 N = normalize(vec3(-slope, 0.12 * sin(ph * 0.5 + yy * 3.0) * amp, 1.0));

  // cloth coordinate on the artwork: both panels side by side, unfolded
  float s = left ? u * 0.5 : 1.0 - u * 0.5;
  s += h * 0.004; // the weave sways inside each fold
  vec3 art = toLin(texture2D(uArt, vec2(s, p.y)).rgb);
  // the name fades in as the curtain is let down (artwork alpha holds it)
  float nameMask = texture2D(uArt, vec2(s, p.y)).a;
  // the name fades in as the curtain is let down, and out as it gathers into the sides
  float ink = uInk * (1.0 - smoothstep(0.55, 0.95, uOpen));
  vec3 base = mix(toLin(vec3(0.16, 0.095, 0.055)), art, mix(1.0, ink, nameMask));

  // velvet: front light, deep valleys, bright sheen on the turning folds
  vec3 L = normalize(vec3(0.15, -0.35, 1.0));
  float diff = max(dot(N, L), 0.0);
  float ao = 0.45 + 0.55 * smoothstep(-1.2, 1.0, h);
  float sheen = pow(1.0 - N.z, 1.6);
  vec3 col = base * (0.18 + 0.95 * diff) * ao + base * sheen * 2.2 + vec3(0.06, 0.035, 0.015) * sheen;

  // warm light from inside the tent catches the folds facing the opening
  float facing = clamp(left ? N.x : -N.x, 0.0, 1.0);
  float nearGap = exp(-(1.0 - u) * 3.0 / max(gather, 1.0));
  col += vec3(1.0, 0.62, 0.28) * facing * nearGap * uOpen * 0.55 * base * 6.0;

  // leading edge: a gold-trimmed hem, rimmed by the light behind
  float lead = 1.0 - u;
  float trim = smoothstep(0.012, 0.0, lead * (1.0 / max(gather, 1.0)) * 1.0);
  col = mix(col, toLin(vec3(0.74, 0.56, 0.3)) * (0.5 + 0.8 * diff), trim * 0.85);
  col += vec3(1.0, 0.7, 0.35) * smoothstep(0.03, 0.0, lead * w) * uOpen * 0.35;

  // shadow under the pelmet and toward the floor
  col *= smoothstep(TOP - 0.01, TOP + 0.12, p.y) * 0.65 + 0.35;
  col *= 1.0 - 0.35 * smoothstep(0.7, 1.0, p.y);

  // soft edge
  float a = left ? smoothstep(leftEdge, leftEdge - 1.5 * px, p.x) : smoothstep(rightEdge, rightEdge + 1.5 * px, p.x);
  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)) * a, a);
}
`;

export interface CurtainState {
  open: number;
  drop: number;
  ripple: number;
  mouseX: number; // css px
  mouseY: number;
  ink: number;
}

export interface CurtainRenderer {
  render: (s: CurtainState, time: number) => void;
  destroy: () => void;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/**
 * The cloth's surface, laid flat: velvet nap, gold-thread khayameya embroidery,
 * the braided seam where the panels meet, the hem, and the name in the alpha
 * channel's partner (drawn in cream, and marked in alpha so it can fade in).
 */
async function paintArt(W: number, H: number, fontFamily: string) {
  const scale = Math.min(1, 2048 / W);
  const cw = Math.round(W * scale);
  const ch = Math.round(H * scale);
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const g = c.getContext("2d")!;

  // velvet ground with vertical nap
  g.fillStyle = "#2a1a0f";
  g.fillRect(0, 0, cw, ch);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let x = 0; x < cw; x += 1) {
    g.fillStyle = `rgba(${rnd() > 0.5 ? "255,220,180" : "0,0,0"},${(rnd() * 0.05).toFixed(3)})`;
    g.fillRect(x, 0, 1, ch);
  }

  // embroidery: the khayameya tile in gold thread, low and quiet
  try {
    const tile = await loadImage("/patterns/curtain-dark.svg");
    const size = Math.round((cw < 900 ? 120 : 150) * scale * (W < 720 ? 1 : 1));
    g.globalAlpha = 0.28;
    for (let y = 0; y < ch; y += size) for (let x = -size / 2; x < cw; x += size) g.drawImage(tile, x + ((cw / 2) % size), y, size, size);
    g.globalAlpha = 1;
  } catch {
    /* plain velvet is fine */
  }

  // the seam where the panels meet: braided gold bands
  const band = Math.max(6, cw * 0.012);
  for (const [x, wd, col] of [
    [cw / 2 - band * 2.4, band * 1.6, "#6b4724"],
    [cw / 2 - band * 0.6, band * 1.2, "#b8925a"],
    [cw / 2 + band * 0.8, band * 1.6, "#6b4724"],
  ] as Array<[number, number, string]>) {
    g.fillStyle = col;
    g.fillRect(x, 0, wd, ch);
  }

  // hem
  const hem = ch * 0.07;
  g.fillStyle = "#170e07";
  g.fillRect(0, ch - hem, cw, hem);
  const line = Math.max(2, hem * 0.07);
  g.fillStyle = "#a8844c";
  g.fillRect(0, ch - hem, cw, line);
  g.fillRect(0, ch - hem * 0.28, cw, line * 0.6);
  // braid: small twisted beads along the band
  g.fillStyle = "#c9a265";
  for (let x = 0; x < cw; x += line * 3) {
    g.beginPath();
    g.ellipse(x, ch - hem + line * 2.2, line * 1.1, line * 0.55, 0.6, 0, Math.PI * 2);
    g.fill();
  }

  // the name, across the seam. Drawn in its own pass so its alpha marks it.
  const nameCanvas = document.createElement("canvas");
  nameCanvas.width = cw;
  nameCanvas.height = ch;
  const n = nameCanvas.getContext("2d")!;
  const fs = Math.round(Math.min(cw * (W < 720 ? 0.42 : 0.3), ch * 0.42));
  try {
    await document.fonts.load(`700 ${fs}px ${fontFamily}`, "سمسم");
  } catch {
    /* fall back to whatever is loaded */
  }
  n.font = `700 ${fs}px ${fontFamily}`;
  n.textAlign = "center";
  n.textBaseline = "middle";
  n.direction = "rtl";
  const ny = ch * (W < 720 ? 0.42 : 0.44);
  n.fillStyle = "#4a2f17";
  n.fillText("سمسم", cw / 2, ny + fs * 0.03);
  n.fillStyle = "#f0dcb4";
  n.fillText("سمسم", cw / 2, ny);

  // compose: RGB = cloth with the name on it, A = where the name is (for its fade-in)
  g.drawImage(nameCanvas, 0, 0);
  const img = g.getImageData(0, 0, cw, ch);
  const nm = n.getImageData(0, 0, cw, ch).data;
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = nm[i]!;
  return img;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}

/** Returns null when WebGL is unavailable; the caller keeps its CSS curtain. */
export async function createCurtainRenderer(
  canvas: HTMLCanvasElement,
  opts: { fontFamily: string; calm: boolean },
): Promise<CurtainRenderer | null> {
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

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // RGB and alpha are separate data here (alpha marks the name), so no premultiply on upload
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

  const U = (n: string) => gl.getUniformLocation(prog, n);
  gl.uniform1i(U("uArt"), 0);
  const uRes = U("uRes");
  const uTime = U("uTime");
  const uOpen = U("uOpen");
  const uDrop = U("uDrop");
  const uRipple = U("uRipple");
  const uMouse = U("uMouse");
  const uFolds = U("uFolds");
  const uInk = U("uInk");
  const uCalm = U("uCalm");
  gl.uniform1f(uCalm, opts.calm ? 1 : 0);

  let cssW = 0;
  let cssH = 0;
  let painting = 0;
  const paint = async () => {
    const id = ++painting;
    const img = await paintArt(cssW, cssH, opts.fontFamily);
    if (id !== painting) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  };
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, cssW < 820 ? 1.5 : 1.25);
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uFolds, cssW < 720 ? 5 : 8);
  };
  resize();
  await paint();
  let timer = 0;
  const ro = new ResizeObserver(() => {
    if (canvas.clientWidth === cssW && canvas.clientHeight === cssH) return;
    resize();
    window.clearTimeout(timer);
    timer = window.setTimeout(paint, 150);
  });
  ro.observe(canvas);

  return {
    render(s, time) {
      gl.uniform1f(uTime, time);
      gl.uniform1f(uOpen, s.open);
      gl.uniform1f(uDrop, s.drop);
      gl.uniform1f(uRipple, s.ripple);
      gl.uniform1f(uInk, s.ink);
      const r = canvas.getBoundingClientRect();
      gl.uniform2f(uMouse, (s.mouseX - r.left) / Math.max(1, r.width), (s.mouseY - r.top) / Math.max(1, r.height));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      ro.disconnect();
      window.clearTimeout(timer);
      // free our resources but keep the context: React may mount again on this same canvas,
      // and getContext() would hand back a lost context forever after loseContext()
      painting++;
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
  };
}
