import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  Layers,
  Move,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import defaultArtworkImg from '../../assets/images/aura_og_preview_1789554278437.jpg';

interface RectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

type BackdropMode = 'calibration' | 'artwork';

/**
 * Generates a rich, high-contrast visual test scene on a canvas.
 * Includes artwork regions, warm/cool luminance extremes, sharp architectural diagonals,
 * concentric rings, a 40px calibration grid, and crisp typography so any optical bending
 * across a glass boundary is unmistakably visible.
 */
function renderRichSceneToCanvas(
  canvas: HTMLCanvasElement,
  artworkElement: HTMLImageElement | null,
  mode: BackdropMode
) {
  const W = 1600;
  const H = 1000;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Deep obsidian base
  ctx.fillStyle = '#070912';
  ctx.fillRect(0, 0, W, H);

  // 2. Base artwork layer (rich color variation)
  if (artworkElement && artworkElement.complete && artworkElement.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = mode === 'artwork' ? 0.92 : 0.72;
    const scale = Math.max(W / artworkElement.naturalWidth, H / artworkElement.naturalHeight);
    const dw = artworkElement.naturalWidth * scale;
    const dh = artworkElement.naturalHeight * scale;
    ctx.drawImage(artworkElement, (W - dw) * 0.5, (H - dh) * 0.5, dw, dh);
    ctx.restore();
  }

  // 3. Saturated volumetric light & dark regions for transmission contrast
  const orbs = [
    { x: W * 0.22, y: H * 0.28, r: 340, c0: 'rgba(56, 189, 248, 0.65)', c1: 'rgba(56, 189, 248, 0)' },
    { x: W * 0.76, y: H * 0.26, r: 320, c0: 'rgba(244, 114, 182, 0.58)', c1: 'rgba(244, 114, 182, 0)' },
    { x: W * 0.32, y: H * 0.76, r: 300, c0: 'rgba(251, 191, 36, 0.55)', c1: 'rgba(251, 191, 36, 0)' },
    { x: W * 0.72, y: H * 0.72, r: 360, c0: 'rgba(99, 102, 241, 0.65)', c1: 'rgba(99, 102, 241, 0)' },
  ];
  for (const orb of orbs) {
    const grad = ctx.createRadialGradient(orb.x, orb.y, 12, orb.x, orb.y, orb.r);
    grad.addColorStop(0, orb.c0);
    grad.addColorStop(1, orb.c1);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark contrast pockets so bright highlights pop against shadow regions
  ctx.fillStyle = 'rgba(4, 6, 12, 0.45)';
  ctx.fillRect(W * 0.38, H * 0.14, W * 0.24, H * 0.72);

  // 4. Crisp 40px optical calibration grid (straight lines expose refraction immediately)
  const gridAlpha = mode === 'artwork' ? 0.18 : 0.28;
  ctx.strokeStyle = `rgba(255, 255, 255, ${gridAlpha})`;
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }

  // Emphasized major axis lines every 160px
  ctx.strokeStyle = mode === 'artwork' ? 'rgba(255, 255, 255, 0.32)' : 'rgba(226, 232, 240, 0.5)';
  ctx.lineWidth = 1.5;
  for (let x = 80; x <= W; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, H);
    ctx.stroke();
  }
  for (let y = 80; y <= H; y += 160) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(W, y + 0.5);
    ctx.stroke();
  }

  // 5. Crisp diagonal beams & geometric circles (dramatically reveal curved bezel lensing)
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.62)';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 8; i++) {
    const startX = i * 240;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX + 420, H);
    ctx.stroke();
  }

  // High-contrast concentric rings + bright white dots
  const ringCenters = [
    { x: W * 0.25, y: H * 0.35, color: 'rgba(125, 211, 252, 0.85)' },
    { x: W * 0.75, y: H * 0.35, color: 'rgba(249, 168, 212, 0.85)' },
    { x: W * 0.25, y: H * 0.72, color: 'rgba(253, 224, 71, 0.85)' },
    { x: W * 0.75, y: H * 0.72, color: 'rgba(165, 180, 252, 0.85)' },
  ];
  for (const rc of ringCenters) {
    ctx.strokeStyle = rc.color;
    ctx.lineWidth = 2.5;
    for (const r of [42, 78, 114]) {
      ctx.beginPath();
      ctx.arc(rc.x, rc.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rc.x, rc.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 6. Sharp calibration typography across the scene
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = '700 34px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('AURA OPTICAL BENCH // REFRACTION TEST', 110, 145);
  ctx.fillText('CURVATURE & EDGE DISPERSION', 860, 145);
  ctx.fillText('TRANSMISSION CONTRAST 48KHZ', 110, 560);
  ctx.fillText('LIQUID MENISCUS BOUNDARY', 860, 560);

  ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
  ctx.font = '600 18px ui-monospace, SFMono-Regular, Menlo, monospace';
  const labels = [
    [110, 180, 'IOR 1.48  //  BEVEL R=24PX  //  CONTRAST 100%'],
    [860, 180, 'NORMAL MAP R/G  //  SNELL EDGE BENDING'],
    [110, 595, '01  02  03  04  05  06  07  08  09  10  11  12'],
    [860, 595, 'HIGHLIGHT  //  SHADOW  //  FINE HAIRLINES'],
    [110, 885, 'AURA ACOUSTIC GLASS ENGINE — SPATIAL ALIGNMENT VERIFICATION'],
    [860, 885, 'PAN BACKGROUND TO INSPECT REAL-TIME REFRACTION'],
  ] as const;
  for (const [tx, ty, text] of labels) {
    ctx.fillText(text, tx, ty);
  }
  ctx.restore();
}

/**
 * Generates an accurate rounded-rectangle optical bevel displacement map for SVG feDisplacementMap.
 * R channel encodes horizontal normal offset, G channel encodes vertical normal offset.
 */
function buildBevelNormalMapUrl(width: number, height: number, cornerRadius = 24, bezelPx = 28): string {
  if (typeof document === 'undefined' || width <= 0 || height <= 0) return '';
  const w = Math.max(64, Math.min(512, Math.round(width)));
  const h = Math.max(64, Math.min(512, Math.round(height)));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(w, h);
  const data = img.data;
  const halfW = w * 0.5;
  const halfH = h * 0.5;
  const rCorner = Math.min(cornerRadius, halfW * 0.48, halfH * 0.48);
  const effectiveBezel = Math.min(bezelPx, Math.min(halfW, halfH) * 0.45);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - halfW;
      const py = y + 0.5 - halfH;

      const qx = Math.abs(px) - (halfW - rCorner);
      const qy = Math.abs(py) - (halfH - rCorner);
      const outX = Math.max(qx, 0);
      const outY = Math.max(qy, 0);
      const sdf = Math.hypot(outX, outY) + Math.min(Math.max(qx, qy), 0) - rCorner;
      const distInside = Math.max(0, -sdf);

      let nx = 0;
      let ny = 0;

      if (distInside < effectiveBezel) {
        const edgeRatio = 1 - distInside / effectiveBezel; // 0 inside -> 1 at perimeter
        // Smooth steep meniscus curve toward outer edge
        const strength = Math.pow(edgeRatio, 1.55);

        let gx = 0;
        let gy = 0;
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy) || 1;
          gx = (qx / len) * Math.sign(px);
          gy = (qy / len) * Math.sign(py);
        } else if (qx > qy) {
          gx = Math.sign(px);
        } else {
          gy = Math.sign(py);
        }

        nx = gx * strength;
        ny = gy * strength;
      }

      // Gentle interior convex lens curvature
      const domeX = (px / halfW) * 0.16;
      const domeY = (py / halfH) * 0.16;

      const rVal = Math.max(0, Math.min(255, Math.round(128 + (nx + domeX) * 120)));
      const gVal = Math.max(0, Math.min(255, Math.round(128 + (ny + domeY) * 120)));

      const idx = (y * w + x) * 4;
      data[idx] = rVal;
      data[idx + 1] = gVal;
      data[idx + 2] = 128;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Sample B: Artwork-Backed Refractive Glass
 * Draws the aligned crop of the scene canvas into a local 2D canvas with gentle radial magnification.
 */
const ArtworkBackedCanvasSurface: React.FC<{
  sceneCanvas: HTMLCanvasElement | null;
  sceneVersion: number;
  stageSize: { w: number; h: number };
  cardRect: RectBox;
  pan: { x: number; y: number };
  frostAmount: number;
  refractionStrength: number;
}> = ({ sceneCanvas, sceneVersion, stageSize, cardRect, pan, frostAmount, refractionStrength }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sceneCanvas || stageSize.w <= 0 || stageSize.h <= 0 || cardRect.w <= 0 || cardRect.h <= 0) {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(cardRect.w * dpr));
    const targetH = Math.max(1, Math.round(cardRect.h * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, targetW, targetH);

    // Map stage CSS coordinates to source sceneCanvas pixels (object-fit: cover behavior)
    const srcW = sceneCanvas.width;
    const srcH = sceneCanvas.height;
    const scaleCover = Math.max(stageSize.w / srcW, stageSize.h / srcH);
    const renderedW = srcW * scaleCover;
    const renderedH = srcH * scaleCover;
    const baseOffsetX = (stageSize.w - renderedW) * 0.5 + pan.x;
    const baseOffsetY = (stageSize.h - renderedH) * 0.5 + pan.y;

    // Subtle magnification zoom around card center (1.03x to 1.12x)
    const zoom = 1 + 0.055 * refractionStrength;
    const cardCenterX = cardRect.x + cardRect.w * 0.5;
    const cardCenterY = cardRect.y + cardRect.h * 0.5;

    ctx.save();
    if (frostAmount > 0.2) {
      ctx.filter = `blur(${(frostAmount * 0.45).toFixed(1)}px) saturate(135%)`;
    } else {
      ctx.filter = 'saturate(135%)';
    }

    // Transform so the source image draws in exact stage alignment with subtle lens zoom around card center
    ctx.scale(dpr, dpr);
    ctx.translate(cardRect.w * 0.5, cardRect.h * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-cardCenterX, -cardCenterY);
    ctx.drawImage(sceneCanvas, baseOffsetX, baseOffsetY, renderedW, renderedH);
    ctx.restore();
  }, [sceneCanvas, sceneVersion, stageSize, cardRect, pan, frostAmount, refractionStrength]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-[inherit]"
    />
  );
};

/**
 * Sample D: Custom WebGL Optical Glass Fragment Shader (zero external dependencies)
 * Computes rounded-rect SDF, surface normal curvature, Snell-inspired edge refraction,
 * micro chromatic dispersion strictly at the bevel rim, Fresnel highlight, and soft frost.
 */
const VERTEX_SHADER_SRC = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision highp float;
  varying vec2 v_uv;

  uniform sampler2D u_scene;
  uniform vec2 u_cardSize;
  uniform vec2 u_cardPos;
  uniform vec2 u_stageSize;
  uniform vec2 u_texSize;
  uniform vec2 u_pan;
  uniform float u_radius;
  uniform float u_refraction;
  uniform float u_frost;
  uniform float u_v1Broken;

  float sdRoundedBox(vec2 p, vec2 halfSize, float r) {
    vec2 q = abs(p) - halfSize + vec2(r);
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  vec2 stagePxToTexUV(vec2 stagePx) {
    float scaleCover = max(u_stageSize.x / u_texSize.x, u_stageSize.y / u_texSize.y);
    vec2 renderedSize = u_texSize * scaleCover;
    vec2 baseOffset = (u_stageSize - renderedSize) * 0.5 + u_pan;
    vec2 uv = (stagePx - baseOffset) / renderedSize;
    // Flip Y for WebGL texture coordinates
    return vec2(uv.x, 1.0 - uv.y);
  }

  vec3 sampleBlurredScene(vec2 uv, float blurRadiusUV) {
    if (blurRadiusUV <= 0.0001) {
      return texture2D(u_scene, clamp(uv, 0.001, 0.999)).rgb;
    }
    vec3 sum = vec3(0.0);
    sum += texture2D(u_scene, clamp(uv + vec2(-blurRadiusUV, -blurRadiusUV), 0.001, 0.999)).rgb * 0.09474;
    sum += texture2D(u_scene, clamp(uv + vec2(0.0,           -blurRadiusUV), 0.001, 0.999)).rgb * 0.11831;
    sum += texture2D(u_scene, clamp(uv + vec2(blurRadiusUV,  -blurRadiusUV), 0.001, 0.999)).rgb * 0.09474;
    sum += texture2D(u_scene, clamp(uv + vec2(-blurRadiusUV, 0.0),           0.001, 0.999)).rgb * 0.11831;
    sum += texture2D(u_scene, clamp(uv,                                      0.001, 0.999)).rgb * 0.14776;
    sum += texture2D(u_scene, clamp(uv + vec2(blurRadiusUV,  0.0),           0.001, 0.999)).rgb * 0.11831;
    sum += texture2D(u_scene, clamp(uv + vec2(-blurRadiusUV, blurRadiusUV),  0.001, 0.999)).rgb * 0.09474;
    sum += texture2D(u_scene, clamp(uv + vec2(0.0,           blurRadiusUV),  0.001, 0.999)).rgb * 0.11831;
    sum += texture2D(u_scene, clamp(uv + vec2(blurRadiusUV,  blurRadiusUV),  0.001, 0.999)).rgb * 0.09474;
    return sum;
  }

  void main() {
    // Convert WebGL v_uv (bottom-left origin) to top-left CSS pixel coordinates inside card
    vec2 localPx = vec2(v_uv.x * u_cardSize.x, (1.0 - v_uv.y) * u_cardSize.y);
    vec2 halfSize = u_cardSize * 0.5;
    vec2 centered = localPx - halfSize;

    float d = sdRoundedBox(centered, halfSize, u_radius);
    float distInside = max(0.0, -d);

    // Compute analytical SDF gradient via finite differences
    float eps = 1.5;
    float dx = sdRoundedBox(centered + vec2(eps, 0.0), halfSize, u_radius) - sdRoundedBox(centered - vec2(eps, 0.0), halfSize, u_radius);
    float dy = sdRoundedBox(centered + vec2(0.0, eps), halfSize, u_radius) - sdRoundedBox(centered - vec2(0.0, eps), halfSize, u_radius);
    vec2 normal2D = normalize(vec2(dx, dy) + vec2(1e-5));

    // Curved meniscus bezel profile (0 inside -> 1 at outer rim)
    float bezelWidth = 34.0;
    float edgeT = clamp(1.0 - distInside / bezelWidth, 0.0, 1.0);
    float meniscus = pow(edgeT, 1.75);

    // Gentle optical dome refraction across the interior + strong curved edge bending
    vec2 domeShiftPx = (centered / max(halfSize, vec2(1.0))) * (10.0 * u_refraction);
    vec2 bevelShiftPx = -normal2D * (meniscus * 34.0 * u_refraction);
    vec2 refractedStagePx = u_cardPos + localPx + bevelShiftPx + domeShiftPx;

    vec2 baseUV = stagePxToTexUV(refractedStagePx);

    // Very subtle optical dispersion strictly on curved bezel edges
    float dispScale = meniscus * 0.0032 * u_refraction;
    vec2 dispVec = normal2D * dispScale;

    float blurPx = u_v1Broken > 0.5 ? 24.0 : u_frost;
    float blurUV = (blurPx / max(u_stageSize.x, 1.0)) * 0.85;

    float r = sampleBlurredScene(baseUV + dispVec, blurUV).r;
    float g = sampleBlurredScene(baseUV, blurUV).g;
    float b = sampleBlurredScene(baseUV - dispVec, blurUV).b;
    vec3 col = vec3(r, g, b);

    // Slight saturation boost & crisp glass tint (Beer-Lambert depth absorption, NOT opaque)
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, 1.24);
    col = mix(col, vec3(0.05, 0.075, 0.14), u_v1Broken > 0.5 ? 0.68 : 0.24);

    // Directional Fresnel specular highlight (stronger on top-left & curved rim, zero neon)
    vec2 lightDir = normalize(vec2(-0.55, -0.85));
    float specAlign = max(0.0, dot(normal2D, lightDir));
    float rimFresnel = pow(edgeT, 2.2) * (0.28 + 0.55 * specAlign);
    float topSheen = smoothstep(0.65, 0.0, localPx.y / max(u_cardSize.y, 1.0)) * 0.055;

    col += vec3(0.88, 0.93, 1.0) * (rimFresnel * 0.42 + topSheen);

    // Soft inner shadow along bottom rim for optical thickness
    float bottomEdge = pow(edgeT, 1.8) * max(0.0, dot(normal2D, vec2(0.0, 1.0)));
    col *= (1.0 - bottomEdge * 0.24);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const WebGLOpticalSurface: React.FC<{
  sceneCanvas: HTMLCanvasElement | null;
  sceneVersion: number;
  stageSize: { w: number; h: number };
  cardRect: RectBox;
  pan: { x: number; y: number };
  refractionStrength: number;
  frostAmount: number;
  v1BrokenMode: boolean;
}> = ({
  sceneCanvas,
  sceneVersion,
  stageSize,
  cardRect,
  pan,
  refractionStrength,
  frostAmount,
  v1BrokenMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glStateRef = useRef<{
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    texture: WebGLTexture;
    buffer: WebGLBuffer;
    uniforms: Record<string, WebGLUniformLocation | null>;
  } | null>(null);
  const [webglStatus, setWebglStatus] = useState<'active' | 'fallback'>('active');

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'default',
    });
    if (!gl) {
      setWebglStatus('fallback');
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) {
      setWebglStatus('fallback');
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglStatus('fallback');
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      setWebglStatus('fallback');
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      setWebglStatus('fallback');
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    if (!texture) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      setWebglStatus('fallback');
      return;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uniforms = {
      u_scene: gl.getUniformLocation(program, 'u_scene'),
      u_cardSize: gl.getUniformLocation(program, 'u_cardSize'),
      u_cardPos: gl.getUniformLocation(program, 'u_cardPos'),
      u_stageSize: gl.getUniformLocation(program, 'u_stageSize'),
      u_texSize: gl.getUniformLocation(program, 'u_texSize'),
      u_pan: gl.getUniformLocation(program, 'u_pan'),
      u_radius: gl.getUniformLocation(program, 'u_radius'),
      u_refraction: gl.getUniformLocation(program, 'u_refraction'),
      u_frost: gl.getUniformLocation(program, 'u_frost'),
      u_v1Broken: gl.getUniformLocation(program, 'u_v1Broken'),
    };

    glStateRef.current = { gl, program, texture, buffer, uniforms };
    setWebglStatus('active');
  }, []);

  // Setup WebGL context + context lost/restored listeners + full cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initWebGL();

    const handleLost = (e: Event) => {
      e.preventDefault();
      glStateRef.current = null;
      setWebglStatus('fallback');
    };
    const handleRestored = () => {
      initWebGL();
    };

    canvas.addEventListener('webglcontextlost', handleLost);
    canvas.addEventListener('webglcontextrestored', handleRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost);
      canvas.removeEventListener('webglcontextrestored', handleRestored);
      const state = glStateRef.current;
      if (state) {
        const { gl, program, texture, buffer } = state;
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        glStateRef.current = null;
      }
    };
  }, [initWebGL]);

  // Upload texture only when sceneCanvas changes
  useEffect(() => {
    const state = glStateRef.current;
    if (!state || !sceneCanvas || sceneCanvas.width === 0) return;
    const { gl, texture } = state;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sceneCanvas);
    } catch {
      setWebglStatus('fallback');
    }
  }, [sceneCanvas, sceneVersion, webglStatus]);

  // Draw on resize, pan, or parameter update
  useEffect(() => {
    const state = glStateRef.current;
    const canvas = canvasRef.current;
    if (
      !state ||
      !canvas ||
      !sceneCanvas ||
      stageSize.w <= 0 ||
      stageSize.h <= 0 ||
      cardRect.w <= 0 ||
      cardRect.h <= 0
    ) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(cardRect.w * dpr));
    const targetH = Math.max(1, Math.round(cardRect.h * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const { gl, program, texture, uniforms } = state;
    gl.viewport(0, 0, targetW, targetH);
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniforms.u_scene, 0);
    gl.uniform2f(uniforms.u_cardSize, cardRect.w, cardRect.h);
    gl.uniform2f(uniforms.u_cardPos, cardRect.x, cardRect.y);
    gl.uniform2f(uniforms.u_stageSize, stageSize.w, stageSize.h);
    gl.uniform2f(uniforms.u_texSize, sceneCanvas.width, sceneCanvas.height);
    gl.uniform2f(uniforms.u_pan, pan.x, pan.y);
    gl.uniform1f(uniforms.u_radius, 24.0);
    gl.uniform1f(uniforms.u_refraction, refractionStrength);
    gl.uniform1f(uniforms.u_frost, frostAmount);
    gl.uniform1f(uniforms.u_v1Broken, v1BrokenMode ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [sceneCanvas, sceneVersion, stageSize, cardRect, pan, refractionStrength, frostAmount, v1BrokenMode, webglStatus]);

  if (webglStatus === 'fallback') {
    return (
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          backgroundColor: 'rgba(12, 16, 26, 0.45)',
          backdropFilter: `blur(${Math.max(8, frostAmount * 2)}px) saturate(140%)`,
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-[inherit]"
    />
  );
};

/**
 * Isolated Optical Glass Lab Component
 * Compares 4 distinct glass rendering approaches over the same spatially aligned backdrop.
 */
export const OpticalGlassLab: React.FC = () => {
  const { setCurrentView, currentTrack } = useMusic();

  const stageRef = useRef<HTMLDivElement>(null);
  const cardARef = useRef<HTMLDivElement>(null);
  const cardBRef = useRef<HTMLDivElement>(null);
  const cardCRef = useRef<HTMLDivElement>(null);
  const cardDRef = useRef<HTMLDivElement>(null);

  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sceneDataUrl, setSceneDataUrl] = useState<string>('');
  const [sceneVersion, setSceneVersion] = useState<number>(0);

  const [backdropMode, setBackdropMode] = useState<BackdropMode>('calibration');
  const [refractionStrength, setRefractionStrength] = useState<number>(1.15);
  const [frostAmount, setFrostAmount] = useState<number>(2.5);
  const [v1BrokenMode, setV1BrokenMode] = useState<boolean>(false);
  const [isAutoDrifting, setIsAutoDrifting] = useState<boolean>(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStateRef = useRef<{ active: boolean; startX: number; startY: number; origX: number; origY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 1000, h: 640 });
  const [rects, setRects] = useState<{ a: RectBox; b: RectBox; c: RectBox; d: RectBox }>({
    a: { x: 0, y: 0, w: 320, h: 240 },
    b: { x: 0, y: 0, w: 320, h: 240 },
    c: { x: 0, y: 0, w: 320, h: 240 },
    d: { x: 0, y: 0, w: 320, h: 240 },
  });

  const rawSvgId = useId();
  const svgBaseId = useMemo(() => rawSvgId.replace(/[^a-zA-Z0-9_-]/g, ''), [rawSvgId]);
  const svgFilterId = `lab-svg-optical-${svgBaseId}`;
  const svgClipId = `lab-svg-clip-${svgBaseId}`;

  // Respect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq.matches) {
        setIsAutoDrifting(false);
      }
    }
  }, []);

  // Build shared high-contrast scene canvas & dataURL once per backdropMode/artwork change
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!sceneCanvasRef.current) {
      sceneCanvasRef.current = document.createElement('canvas');
    }
    const canvas = sceneCanvasRef.current;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const targetSrc =
      backdropMode === 'artwork' && currentTrack?.coverUrl
        ? currentTrack.coverUrl
        : defaultArtworkImg;

    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      renderRichSceneToCanvas(canvas, img, backdropMode);
      setSceneDataUrl(canvas.toDataURL('image/jpeg', 0.92));
      setSceneVersion((v) => v + 1);
    };
    img.onerror = () => {
      if (cancelled) return;
      // Fallback to calibration artwork if external cover lacks CORS headers
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        if (cancelled) return;
        renderRichSceneToCanvas(canvas, fallbackImg, backdropMode);
        setSceneDataUrl(canvas.toDataURL('image/jpeg', 0.92));
        setSceneVersion((v) => v + 1);
      };
      fallbackImg.src = defaultArtworkImg;
    };
    img.src = targetSrc;

    return () => {
      cancelled = true;
    };
  }, [backdropMode, currentTrack?.coverUrl]);

  // Track exact bounding boxes of the stage and all 4 glass surfaces via ResizeObserver
  const measureBounds = useCallback(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const sRect = stageEl.getBoundingClientRect();
    const getRel = (el: HTMLDivElement | null): RectBox => {
      if (!el) return { x: 0, y: 0, w: 300, h: 220 };
      const r = el.getBoundingClientRect();
      return {
        x: r.left - sRect.left,
        y: r.top - sRect.top,
        w: r.width,
        h: r.height,
      };
    };
    setStageSize({ w: sRect.width, h: sRect.height });
    setRects({
      a: getRel(cardARef.current),
      b: getRel(cardBRef.current),
      c: getRel(cardCRef.current),
      d: getRel(cardDRef.current),
    });
  }, []);

  useEffect(() => {
    measureBounds();
    const ro = new ResizeObserver(() => measureBounds());
    if (stageRef.current) ro.observe(stageRef.current);
    if (cardARef.current) ro.observe(cardARef.current);
    if (cardBRef.current) ro.observe(cardBRef.current);
    if (cardCRef.current) ro.observe(cardCRef.current);
    if (cardDRef.current) ro.observe(cardDRef.current);
    window.addEventListener('resize', measureBounds);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureBounds);
    };
  }, [measureBounds]);

  // Smooth optional drift animation to inspect edge bending dynamically
  useEffect(() => {
    if (!isAutoDrifting) return;
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) * 0.0008;
      setPan({
        x: Math.sin(t) * 85,
        y: Math.cos(t * 0.7) * 55,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isAutoDrifting]);

  // Pointer drag on stage to slide backdrop under all 4 samples simultaneously
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAutoDrifting) setIsAutoDrifting(false);
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    setPan({
      x: Math.max(-220, Math.min(220, dragStateRef.current.origX + dx)),
      y: Math.max(-160, Math.min(160, dragStateRef.current.origY + dy)),
    });
  };

  const handlePointerUp = () => {
    dragStateRef.current.active = false;
  };

  // Precompute Sample C's rounded-rectangle normal map matched to cardC dimensions
  const svgBevelMapUrl = useMemo(() => {
    return buildBevelNormalMapUrl(
      Math.round(rects.c.w || 360),
      Math.round(rects.c.h || 240),
      24,
      30
    );
  }, [rects.c.w, rects.c.h]);

  // Compute CSS background geometry matching object-fit: cover for stageSize
  const coverMetrics = useMemo(() => {
    const texW = 1600;
    const texH = 1000;
    const scale = Math.max(stageSize.w / texW, stageSize.h / texH);
    const renderedW = texW * scale;
    const renderedH = texH * scale;
    const offsetX = (stageSize.w - renderedW) * 0.5 + pan.x;
    const offsetY = (stageSize.h - renderedH) * 0.5 + pan.y;
    return { renderedW, renderedH, offsetX, offsetY };
  }, [stageSize, pan]);

  const effectiveSvgScale = v1BrokenMode ? 8 : Math.round(28 * refractionStrength);
  const effectiveSvgBlur = v1BrokenMode ? 20 : Number((frostAmount * 0.45).toFixed(2));
  const effectiveCssBlur = v1BrokenMode ? 28 : Math.round(frostAmount * 4.5 + 4);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setCurrentView('settings')}
            className="mt-0.5 p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 transition-colors cursor-pointer"
            aria-label="Back to Settings"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AURA Optical Glass Lab
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/25">
                Iteration 2 Benchmark
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Side-by-side optical comparison over a shared, pixel-aligned textured scene. Drag the stage to watch lines and artwork cross each glass boundary.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setBackdropMode(backdropMode === 'calibration' ? 'artwork' : 'calibration')}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Scene: {backdropMode === 'calibration' ? 'Art + Calibration Grid' : 'Track Art + Grid'}</span>
          </button>

          <button
            type="button"
            onClick={() => setV1BrokenMode((v) => !v)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              v1BrokenMode
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                : 'bg-white/[0.06] hover:bg-white/[0.11] border-white/[0.08] text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{v1BrokenMode ? 'Simulating v1 Over-Blurred Scrim' : 'Simulate v1 Flaw'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAutoDrifting((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.08] text-xs font-medium text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            {isAutoDrifting ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isAutoDrifting ? 'Pause Drift' : 'Auto Drift'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAutoDrifting(false);
              setPan({ x: 0, y: 0 });
              setRefractionStrength(1.15);
              setFrostAmount(2.5);
              setV1BrokenMode(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.08] text-xs font-medium text-zinc-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Optical Parameter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Refraction / Bevel Scale
            </span>
            <span className="font-mono text-indigo-300">{refractionStrength.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.05"
            value={refractionStrength}
            onChange={(e) => setRefractionStrength(parseFloat(e.target.value))}
            className="w-full accent-indigo-400 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              Surface Frost (Blur)
            </span>
            <span className="font-mono text-sky-300">{frostAmount.toFixed(1)} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={frostAmount}
            onChange={(e) => setFrostAmount(parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 bg-black/30 rounded-xl px-3.5 py-2 border border-white/[0.05]">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Drag anywhere on the test stage below to move straight lines &amp; text across all 4 lenses.</span>
          </div>
          <span className="font-mono text-[11px] text-zinc-500 ml-2 shrink-0">
            {Math.round(pan.x)},{Math.round(pan.y)}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          SHARED HIGH-DETAIL OPTICAL BENCH STAGE
          ------------------------------------------------------------------ */}
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative rounded-3xl overflow-hidden border border-white/[0.1] select-none cursor-grab active:cursor-grabbing p-5 sm:p-8 min-h-[620px] bg-[#060810] shadow-2xl"
      >
        {/* Shared Textured Scene Layer directly behind all 4 cards */}
        {sceneDataUrl && (
          <img
            src={sceneDataUrl}
            alt="Shared optical calibration scene"
            draggable={false}
            className="absolute pointer-events-none max-w-none"
            style={{
              left: `${coverMetrics.offsetX}px`,
              top: `${coverMetrics.offsetY}px`,
              width: `${coverMetrics.renderedW}px`,
              height: `${coverMetrics.renderedH}px`,
            }}
          />
        )}

        {/* Four Side-by-Side Glass Samples */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* ==============================================================
              SAMPLE A: CONVENTIONAL TRANSLUCENT GLASS
              ============================================================== */}
          <div
            ref={cardARef}
            className="relative h-64 sm:h-72 rounded-[24px] overflow-hidden"
            style={{
              backgroundColor: v1BrokenMode ? 'rgba(12, 16, 26, 0.78)' : 'rgba(10, 14, 24, 0.34)',
              backgroundImage:
                'linear-gradient(165deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.01) 40%, rgba(0,0,0,0.18) 100%)',
              backdropFilter: `blur(${effectiveCssBlur}px) saturate(140%)`,
              WebkitBackdropFilter: `blur(${effectiveCssBlur}px) saturate(140%)`,
              boxShadow:
                'inset 0 1px 0 0 rgba(255,255,255,0.16), 0 16px 36px rgba(0,0,0,0.45)',
            }}
          >
            <div className="relative z-10 h-full p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300/90">
                    Sample A · Baseline
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-white mt-0.5">
                    Conventional Translucent Glass
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/40 text-zinc-300 border border-white/10">
                  CSS Blur Only
                </span>
              </div>

              <div className="bg-black/35 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-xs text-zinc-200 leading-relaxed">
                Uses only <code className="text-sky-300">backdrop-filter: blur()</code> and tint. Straight grid lines and diagonals remain rigid with zero edge bending or lens curvature.
              </div>
            </div>
          </div>

          {/* ==============================================================
              SAMPLE B: ARTWORK-BACKED REFRACTIVE GLASS
              ============================================================== */}
          <div
            ref={cardBRef}
            className="relative h-64 sm:h-72 rounded-[24px] overflow-hidden"
            style={{
              boxShadow:
                'inset 0 1px 0 0 rgba(255,255,255,0.18), 0 16px 36px rgba(0,0,0,0.45)',
            }}
          >
            <ArtworkBackedCanvasSurface
              sceneCanvas={sceneCanvasRef.current}
              sceneVersion={sceneVersion}
              stageSize={stageSize}
              cardRect={rects.b}
              pan={pan}
              frostAmount={v1BrokenMode ? 48 : frostAmount}
              refractionStrength={refractionStrength}
            />
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                background: v1BrokenMode
                  ? 'rgba(10, 14, 24, 0.72)'
                  : 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(12,16,28,0.18) 45%, rgba(6,9,18,0.34) 100%)',
              }}
            />
            <div className="relative z-10 h-full p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300">
                    Sample B · Aligned Texture
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-white mt-0.5">
                    Artwork-Backed Refractive Glass
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/40 text-sky-200 border border-white/10">
                  2D Canvas Zoom
                </span>
              </div>

              <div className="bg-black/35 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-xs text-zinc-200 leading-relaxed">
                Crops the exact underlying scene bounds and applies subtle center lens magnification ({(1 + 0.055 * refractionStrength).toFixed(2)}x). Shows continuity, but lacks curved bezel refraction.
              </div>
            </div>
          </div>

          {/* ==============================================================
              SAMPLE C: SVG OPTICAL GLASS (feImage Bevel Map + feDisplacementMap)
              ============================================================== */}
          <div
            ref={cardCRef}
            className="relative h-64 sm:h-72 rounded-[24px] overflow-hidden"
            style={{
              boxShadow:
                'inset 0 1px 0 0 rgba(255,255,255,0.22), inset 0 -1px 0 0 rgba(0,0,0,0.45), 0 18px 40px rgba(0,0,0,0.5)',
            }}
          >
            {rects.c.w > 0 && rects.c.h > 0 && sceneDataUrl && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${rects.c.w} ${rects.c.h}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <clipPath id={svgClipId}>
                    <rect x="0" y="0" width={rects.c.w} height={rects.c.h} rx="24" ry="24" />
                  </clipPath>
                  <filter
                    id={svgFilterId}
                    filterUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width={rects.c.w}
                    height={rects.c.h}
                    colorInterpolationFilters="sRGB"
                  >
                    {svgBevelMapUrl && (
                      <feImage
                        href={svgBevelMapUrl}
                        x="0"
                        y="0"
                        width={rects.c.w}
                        height={rects.c.h}
                        preserveAspectRatio="none"
                        result="bevelMap"
                      />
                    )}
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="bevelMap"
                      scale={effectiveSvgScale}
                      xChannelSelector="R"
                      yChannelSelector="G"
                      result="refracted"
                    />
                    {effectiveSvgBlur > 0.1 && (
                      <feGaussianBlur in="refracted" stdDeviation={effectiveSvgBlur} />
                    )}
                  </filter>
                </defs>

                <g clipPath={`url(#${svgClipId})`} filter={`url(#${svgFilterId})`}>
                  <rect x="0" y="0" width={rects.c.w} height={rects.c.h} fill="#070912" />
                  <image
                    href={sceneDataUrl}
                    x={coverMetrics.offsetX - rects.c.x}
                    y={coverMetrics.offsetY - rects.c.y}
                    width={coverMetrics.renderedW}
                    height={coverMetrics.renderedH}
                    preserveAspectRatio="none"
                  />
                </g>
              </svg>
            )}

            {/* Directional specular catch & restrained glass tint */}
            <div
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                background: v1BrokenMode
                  ? 'rgba(10, 14, 24, 0.72)'
                  : 'linear-gradient(155deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 28%, rgba(8,12,22,0.28) 100%)',
              }}
            />

            <div className="relative z-10 h-full p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300">
                    Sample C · SVG Filter
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-white mt-0.5">
                    SVG Optical Glass
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/45 text-emerald-200 border border-emerald-400/25">
                  feDisplacementMap ({effectiveSvgScale}px)
                </span>
              </div>

              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-xs text-zinc-200 leading-relaxed">
                Uses a generated rounded-rect normal map (<code className="text-emerald-300">feImage</code>) + <code className="text-emerald-300">feDisplacementMap</code> with minimal post-blur ({effectiveSvgBlur}px). Lines visibly bend inward along the bezel.
              </div>
            </div>
          </div>

          {/* ==============================================================
              SAMPLE D: WEBGL OPTICAL GLASS (SDF Lens + Chromatic Edge Dispersion)
              ============================================================== */}
          <div
            ref={cardDRef}
            className="relative h-64 sm:h-72 rounded-[24px] overflow-hidden"
            style={{
              boxShadow:
                'inset 0 1px 0 0 rgba(255,255,255,0.25), inset 0 -1px 0 0 rgba(0,0,0,0.5), 0 20px 44px rgba(0,0,0,0.55)',
            }}
          >
            <WebGLOpticalSurface
              sceneCanvas={sceneCanvasRef.current}
              sceneVersion={sceneVersion}
              stageSize={stageSize}
              cardRect={rects.d}
              pan={pan}
              refractionStrength={refractionStrength}
              frostAmount={frostAmount}
              v1BrokenMode={v1BrokenMode}
            />

            <div className="relative z-10 h-full p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
                    Sample D · GPU Shader
                  </span>
                  <h2 className="text-base sm:text-lg font-semibold text-white mt-0.5">
                    WebGL Optical Glass
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/45 text-amber-200 border border-amber-400/25">
                  SDF Lens + Dispersion
                </span>
              </div>

              <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-xs text-zinc-200 leading-relaxed">
                Analytical rounded-box SDF computes meniscus curvature, Snell-inspired refraction, subtle bevel dispersion, and Fresnel specular reflection at 60fps directly on the GPU.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          DIAGNOSIS OF PREVIOUS IMPLEMENTATION & ARCHITECTURE REPORT
          ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <h3>Why Previous OpticalGlassSurface Looked Like a Dark CSS Panel</h3>
          </div>
          <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
            <li>
              <strong className="text-white">1. Heavy blur erased displacement:</strong> Applying <code className="text-amber-200">feGaussianBlur stdDeviation=&quot;20&quot;</code> inside the filter followed by CSS <code className="text-amber-200">blur(28px)</code> + <code className="text-amber-200">blur-[36px]</code> completely wiped out an 8px <code className="text-amber-200">feDisplacementMap</code>.
            </li>
            <li>
              <strong className="text-white">2. Severe dark scrim occlusion (~90%):</strong> A dark vertical scrim (<code className="text-amber-200">from-[#090c14]/40 to-[#07090e]/85</code>) stacked directly under <code className="text-amber-200">rgba(12, 16, 26, 0.68)</code> blocked almost all light transmission.
            </li>
            <li>
              <strong className="text-white">3. Non-unique filter IDs:</strong> <code className="text-amber-200">aura-refraction-8</code> collided whenever multiple surfaces mounted with the same scale. Fixed via React <code className="text-emerald-300">useId()</code>.
            </li>
            <li>
              <strong className="text-white">4. Unaligned texture (`scale-150`):</strong> Scaling a centered image disconnected the optical layer from the backdrop behind the component.
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
            <Cpu className="w-4 h-4" />
            <h3>Practical Architecture Findings &amp; Constraints</h3>
          </div>
          <ul className="text-xs text-zinc-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>
                <strong className="text-white">Best visual realism (Sample D — WebGL):</strong> Produces unmistakable physical meniscus bending, crisp center clarity, and subtle prism dispersion at the rim without muddiness. Requires a texture source (cannot sample arbitrary DOM elements behind it directly) and must share/cap contexts cleanly.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
              <span>
                <strong className="text-white">Best lightweight DOM-native fallback (Sample C — SVG):</strong> A precomputed rounded-rect bevel normal map in <code className="text-sky-300">feImage</code> + <code className="text-sky-300">feDisplacementMap</code> creates real perimeter bending with zero GPU context overhead, provided post-blur stays minimal (&lt; 2px) and source texture is supplied directly.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <span>
                <strong className="text-white">Core web platform constraint:</strong> Neither SVG <code className="text-amber-200">backdrop-filter: url()</code> nor WebGL can natively refract live HTML text/lists behind an overlay across Safari/Firefox/Chromium. Both engines work best when backed by AURA&apos;s controlled artwork + atmospheric scene texture.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
