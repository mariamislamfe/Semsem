/**
 * The fanous hero, as one fragment shader over a real photograph.
 *
 *  - the flame flickers inside the glass and heat shimmers above it
 *  - on load the light spreads out from the lantern (it is being lit)
 *  - the black around it is a tent wall: khayameya cloth that only shows where
 *    your own light (pointer / finger) falls on it
 *  - scrolling pushes the camera into the lantern until its red glass becomes
 *    the red of the tablecloth that follows
 *
 * Plain WebGL 1 (no three.js): one quad, two textures, ~3 KB of code.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D uImg;
uniform sampler2D uPat;
uniform vec2 uRes;
uniform vec2 uImgSize;
uniform vec2 uMouse;
uniform vec2 uLamp;
uniform float uTime;
uniform float uProg;
uniform float uIntro;
uniform float uDpr;
uniform float uCalm;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n1(float t) { return fract(sin(t * 12.9898) * 43758.5453); }

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); // top-left origin
  float resA = uRes.x / uRes.y;
  float imgA = uImgSize.x / uImgSize.y;

  // wide screens: fit the height and sit the lantern to the right, leaving black wall for type
  // tall screens: fit the height and centre the lantern
  float s = uRes.y / uImgSize.y;
  // (mirrors the CSS poster underneath: object-contain right / object-position 70%)
  vec2 off = resA > imgA
    ? vec2(uRes.x - uImgSize.x * s, 0.0)
    : vec2((uRes.x - uImgSize.x * s) * uLamp.x, 0.0);
  vec2 uv = (frag - off) / (uImgSize * s);

  // walk into the light
  float z = 1.0 + uProg * uProg * 3.4;
  uv = uLamp + (uv - uLamp) / z;

  // heat shimmer rising from the lantern top
  vec2 top = uLamp + vec2(0.0, -0.3);
  float haze = smoothstep(0.22, 0.0, distance(uv * vec2(imgA, 1.0), top * vec2(imgA, 1.0)));
  uv.x += sin(uv.y * 70.0 - uTime * 2.4) * 0.0022 * haze * (1.0 - uCalm * 0.7);

  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec3 col = texture2D(uImg, clamp(uv, 0.0, 1.0)).rgb * inside;

  // the flame breathes in the bright glass
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float flick = 0.93 + 0.07 * sin(uTime * 7.3) + 0.06 * (n1(floor(uTime * 13.0)) - 0.5);
  flick = mix(flick, 1.0, uCalm * 0.6);
  col *= mix(1.0, flick, smoothstep(0.2, 0.75, lum));

  // being lit: light spreads out from the lantern
  float dl = distance(uv * vec2(imgA, 1.0), uLamp * vec2(imgA, 1.0));
  float reach = uIntro * 1.6;
  col *= smoothstep(reach, reach - 0.4, dl);

  // the tent wall: cloth that only shows where your light falls
  vec2 m = vec2(uMouse.x, uMouse.y);
  float dm = distance(frag, m) / uRes.y;
  float yours = exp(-dm * dm * 34.0) * uIntro;
  float lamp = exp(-dl * dl * 7.0) * 0.16 * uIntro;
  vec3 pat = texture2D(uPat, frag / (uDpr * 600.0)).rgb;
  float wall = 1.0 - smoothstep(0.03, 0.14, lum);
  col += pat * (yours * 0.62 + lamp) * wall * vec3(1.0, 0.8, 0.6) * (1.0 - uProg);
  col += vec3(1.0, 0.58, 0.22) * yours * 0.05;

  // the lantern's red glass becomes the tablecloth
  float toCloth = smoothstep(0.55, 1.0, uProg);
  vec3 cloth = vec3(0.70, 0.15, 0.118) * (0.78 + 0.22 * pat.r);
  col = mix(col, cloth, toCloth);

  // film grain and a soft vignette
  col += (hash(frag + fract(uTime) * 91.0) - 0.5) * 0.03;
  float v = smoothstep(1.3, 0.3, length((frag / uRes - 0.5) * vec2(resA, 1.0)));
  col *= mix(1.0, v, 0.55 * (1.0 - toCloth));

  gl_FragColor = vec4(col, 1.0);
}
`;

export interface FanousRenderer {
  setPointer: (x: number, y: number) => void;
  setProgress: (p: number) => void;
  setIntro: (v: number) => void;
  setCalm: (calm: boolean) => void;
  setActive: (on: boolean) => void;
  destroy: () => void;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function patternCanvas() {
  const img = await loadImage("/patterns/khayameya.svg");
  const c = document.createElement("canvas");
  c.width = c.height = 512; // power of two so it can repeat in WebGL 1
  const g = c.getContext("2d")!;
  for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) g.drawImage(img, x * 128, y * 128, 128, 128);
  return c;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
  return sh;
}

/** Returns null if WebGL is unavailable — the caller keeps the static photo. */
export async function createFanousRenderer(
  canvas: HTMLCanvasElement,
  opts: { image: string; lamp: [number, number]; onSlow?: () => void },
): Promise<FanousRenderer | null> {
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) return null;

  let photo: HTMLImageElement;
  let pat: HTMLCanvasElement;
  try {
    [photo, pat] = await Promise.all([loadImage(opts.image), patternCanvas()]);
  } catch {
    return null;
  }

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
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = (unit: number, src: TexImageSource, repeat: boolean) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  };
  tex(0, photo, false);
  tex(1, pat, true);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  gl.uniform1i(u("uImg"), 0);
  gl.uniform1i(u("uPat"), 1);
  gl.uniform2f(u("uImgSize"), photo.naturalWidth, photo.naturalHeight);
  gl.uniform2f(u("uLamp"), opts.lamp[0], opts.lamp[1]);
  const uRes = u("uRes");
  const uMouse = u("uMouse");
  const uTime = u("uTime");
  const uProg = u("uProg");
  const uIntro = u("uIntro");
  const uDpr = u("uDpr");
  const uCalm = u("uCalm");

  let dpr = 1;
  const resize = () => {
    // the effect is soft by nature, so it never needs more than ~1.25× pixels
    dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1 : 1.25);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uDpr, dpr);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // state, smoothed in the loop
  const mouse = { x: -1, y: -1, tx: -1, ty: -1, last: -1e9 };
  let progress = 0;
  let intro = 0;
  let calm = false;
  let active = true;
  let raf = 0;
  const t0 = performance.now();
  // performance guard: if this device can't hold the frame rate, hand back to the static photo
  let last = t0;
  let sampled = 0;
  let slow = 0;

  const frame = (now: number) => {
    raf = 0;
    if (!active) return;
    const t = (now - t0) / 1000;
    // watch a 2-second window after things settle: average frame over ~34 ms means the device is struggling
    if (sampled >= 0 && now - t0 > 1500) {
      sampled++;
      slow += now - last;
      if (now - t0 > 3500) {
        if (slow / sampled > 34) {
          active = false;
          opts.onSlow?.();
          return;
        }
        sampled = -1;
      }
    }
    last = now;
    const w = canvas.width;
    const h = canvas.height;
    // idle: your light drifts slowly along the wall
    if (now - mouse.last > 2500 && !calm) {
      mouse.tx = w * (0.32 + Math.sin(t * 0.33) * 0.22);
      mouse.ty = h * (0.45 + Math.sin(t * 0.51 + 1.2) * 0.22);
    }
    if (mouse.x < 0) {
      mouse.x = mouse.tx < 0 ? w * 0.3 : mouse.tx;
      mouse.y = mouse.ty < 0 ? h * 0.45 : mouse.ty;
    }
    mouse.x += (mouse.tx - mouse.x) * 0.09;
    mouse.y += (mouse.ty - mouse.y) * 0.09;
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uTime, t);
    gl.uniform1f(uProg, progress);
    gl.uniform1f(uIntro, intro);
    gl.uniform1f(uCalm, calm ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    setPointer(x, y) {
      mouse.tx = x * dpr;
      mouse.ty = y * dpr;
      mouse.last = performance.now();
    },
    setProgress(p) {
      progress = p;
    },
    setIntro(v) {
      intro = v;
    },
    setCalm(c) {
      calm = c;
    },
    setActive(on) {
      active = on;
      if (on && !raf) raf = requestAnimationFrame(frame);
    },
    destroy() {
      active = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
