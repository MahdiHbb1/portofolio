// Section shader transition
//
// Fullscreen WebGL dissolve played when navigating between sections on the
// home page (navbar, command palette, hero CTAs). It masks the scroll jump
// and reinforces the technical identity of the site.
//
// Desktop only: skipped for prefers-reduced-motion and viewports <= 900px.
// No dependencies: raw WebGL, no three.js import.

const VERT_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
uniform float uProgress;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  float n = noise(vUv * 5.0 + uTime * 0.18) * 0.65
          + noise(vUv * 11.0 - uTime * 0.11) * 0.35;

  // Phase A (0.0 - 0.40): cover the screen.
  float cover = smoothstep(0.0, 0.4, uProgress);

  // Phase B (0.45 - 1.0): dissolve away, revealing the new section.
  float reveal = smoothstep(0.45, 1.0, uProgress);
  float stillCovered = smoothstep(reveal - 0.06, reveal + 0.16, n);
  float alpha = cover * stillCovered;

  // Accent glow riding the dissolve edge.
  float edge = 1.0 - smoothstep(0.0, 0.14, abs(n - reveal));
  float edgeFade = smoothstep(0.45, 0.55, uProgress) * (1.0 - smoothstep(0.86, 1.0, uProgress));
  float glow = edge * edgeFade;

  vec3 dark = vec3(0.0588, 0.0549, 0.0510);
  vec3 accent = vec3(0.6275, 0.4706, 0.3137);
  vec3 color = mix(dark, accent, glow * 0.9);

  gl_FragColor = vec4(color, alpha);
}
`;

const DURATION_MS = 900;
const SCROLL_AT = 0.45;
const MOBILE_MAX_WIDTH = 900;

interface GLState {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uProgress: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
}

class SectionTransition {
  private reducedMotion: boolean;
  private overlay: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private state: GLState | null = null;
  private playing = false;
  private scrolled = false;
  private startTime = 0;
  private targetHash = '';

  constructor() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('click', this.onClick, true);
    window.addEventListener('resize', this.onResize);

    document.addEventListener('astro:before-swap', () => {
      this.playing = false;
      this.overlay = null;
      this.canvas = null;
      this.state = null;
    });
  }

  // Public API: returns true when the shader handled the navigation
  run(selector: string): boolean {
    if (this.playing) return true;
    if (this.reducedMotion || this.isMobile()) return false;
    if (!document.querySelector(selector)) return false;
    this.play(selector);
    return true;
  }

  private isMobile(): boolean {
    return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
  }

  private onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    const link = target?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link) return;

    const href = link.getAttribute('href') || '';
    let hash: string | null = null;

    if (href.startsWith('#') && href.length > 1) {
      hash = href;
    } else if (href.startsWith('/#') && window.location.pathname === '/') {
      hash = href.slice(1);
    }

    if (!hash) return;

    // Swallow extra clicks while a transition is playing
    if (this.playing) {
      e.preventDefault();
      return;
    }

    // Let the browser handle it when the effect is not applicable
    if (this.reducedMotion || this.isMobile()) return;
    if (!document.querySelector(hash)) return;

    e.preventDefault();
    this.play(hash);
  };

  private play(hash: string) {
    if (!this.ensureOverlay()) {
      this.jumpTo(hash);
      return;
    }

    this.playing = true;
    this.scrolled = false;
    this.targetHash = hash;
    this.startTime = performance.now();

    this.overlay!.style.display = 'block';
    this.overlay!.style.pointerEvents = 'auto';

    requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const state = this.state;
    if (!state || !this.overlay) {
      this.finish();
      return;
    }

    const { gl, program, uProgress, uTime } = state;
    const elapsed = now - this.startTime;
    const progress = Math.min(elapsed / DURATION_MS, 1);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(uProgress, progress);
    gl.uniform1f(uTime, elapsed / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (!this.scrolled && progress >= SCROLL_AT) {
      this.scrolled = true;
      this.jumpTo(this.targetHash);
    }

    if (progress < 1) {
      requestAnimationFrame(this.frame);
    } else {
      this.finish();
    }
  };

  private finish() {
    this.playing = false;
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.overlay.style.pointerEvents = 'none';
    }
  }

  private jumpTo(hash: string) {
    const element = document.querySelector(hash);
    if (!element) return;

    // Force an instant jump even though the page uses smooth scrolling
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    const targetY = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, targetY);
    html.style.scrollBehavior = previousBehavior;

    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }
  }

  private onResize = () => {
    this.resizeCanvas();
  };

  private ensureOverlay(): boolean {
    if (this.overlay && this.state) return true;

    try {
      const overlay = document.createElement('div');
      overlay.className = 'section-transition';
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:9995;display:none;pointer-events:none;';

      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'display:block;width:100%;height:100%;';
      overlay.appendChild(canvas);
      document.body.appendChild(overlay);

      const gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        depth: false,
        stencil: false,
      });

      if (!gl) {
        overlay.remove();
        return false;
      }

      const vertex = this.compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
      const fragment = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
      const program = gl.createProgram();
      if (!vertex || !fragment || !program) {
        overlay.remove();
        return false;
      }

      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        overlay.remove();
        return false;
      }

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const aPos = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      this.overlay = overlay;
      this.canvas = canvas;
      this.state = {
        gl,
        program,
        uProgress: gl.getUniformLocation(program, 'uProgress'),
        uTime: gl.getUniformLocation(program, 'uTime'),
      };

      this.resizeCanvas();
      return true;
    } catch {
      return false;
    }
  }

  private compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[section-transition] shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private resizeCanvas() {
    if (!this.canvas || !this.state) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(window.innerWidth * dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.state.gl.viewport(0, 0, width, height);
  }
}

export function initSectionTransition() {
  const flagged = window as unknown as { __sectionTransitionReady?: boolean };
  if (flagged.__sectionTransitionReady) return;
  flagged.__sectionTransitionReady = true;

  const manager = new SectionTransition();
  (window as any).sectionTransition = (selector: string): boolean => manager.run(selector);
}
