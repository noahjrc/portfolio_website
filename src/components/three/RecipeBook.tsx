'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ctxOf, ensureFonts, makeCanvasTexture } from '@/lib/canvas';
import { getState, setState, useStore } from '@/lib/store';
import { roomTheme } from '@/lib/themes';
import { COUNTER_TOP } from './Kitchen';
import { RBox, mats as sharedMaterials } from './materials';
import { SPREADS, drawPage } from './pages';
import { useInteractive } from './useInteractive';

const PAGE_W = 0.62;
const PAGE_D = 0.82;
const PX_W = 768;
const PX_H = 1016;
const FLIP_SECONDS = 0.8;

// A page lying flat with its spine edge at x = 0, extending to x = PAGE_W.
const pageGeometry = new THREE.PlaneGeometry(PAGE_W, PAGE_D).translate(PAGE_W / 2, 0, 0).rotateX(-Math.PI / 2);

const pageVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

// Two-sided page: the back face shows a different texture, mirrored so it
// reads correctly once the page has turned over to the left.
const pageFragment = /* glsl */ `
  uniform sampler2D uFront;
  uniform sampler2D uBack;
  uniform float uShade;
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vec4 c = gl_FrontFacing ? texture2D(uFront, vUv) : texture2D(uBack, vec2(1.0 - vUv.x, vUv.y));
    vec3 n = normalize(gl_FrontFacing ? vNormalW : -vNormalW);
    float light = 0.72 + 0.28 * clamp(dot(n, normalize(vec3(0.3, 1.0, 0.5))), 0.0, 1.0);
    // The scene's AgX tone mapping flattens contrast and greys out paper. Pre-shape the
    // page so it survives that pass: a contrast curve (darker ink, brighter paper) and a
    // saturation lift (so the red titles and yellow pot stay vivid).
    // Peak paper stays below the bloom threshold, or the glow hazes over the ink.
    vec3 col = pow(c.rgb * light * uShade, vec3(1.7)) * 1.3;
    float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(luma), col, 1.35);
    gl_FragColor = vec4(max(col, 0.0), 1.0);
    #include <colorspace_fragment>
  }
`;

function makePageMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uFront: { value: null }, uBack: { value: null }, uShade: { value: 1 } },
    vertexShader: pageVertex,
    fragmentShader: pageFragment,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

function usePageTextures() {
  const [textures] = useState(() => Array.from({ length: SPREADS * 2 }, () => makeCanvasTexture(PX_W, PX_H)));
  useEffect(() => {
    let live = true;
    (async () => {
      await ensureFonts();
      await Promise.all(
        textures.map(async (texture, i) => {
          if (!live) return;
          await drawPage(ctxOf(texture), PX_W, PX_H, i);
          if (live) texture.needsUpdate = true;
        }),
      );
    })();
    return () => {
      live = false;
    };
  }, [textures]);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  return textures;
}

const nextPage = () => setState({ page: Math.min(SPREADS - 1, getState().page + 1) });
const prevPage = () => setState({ page: Math.max(0, getState().page - 1) });

export function RecipeBook() {
  const textures = usePageTextures();
  const page = useStore((s) => s.page);
  const [shown, setShown] = useState(page);
  const [flip, setFlip] = useState<{ from: number; to: number } | null>(null);
  const progress = useRef(0);
  const pivot = useRef<THREE.Group>(null!);
  const mats = useMemo(() => ({ left: makePageMaterial(), right: makePageMaterial(), flip: makePageMaterial() }), []);

  const right = useInteractive('projects', 'Next page →', nextPage);
  const left = useInteractive('projects', '← Previous page', prevPage);
  const cover = useInteractive('projects');

  // Turn one page at a time toward the requested spread.
  useEffect(() => {
    if (flip || shown === page) return;
    progress.current = 0;
    setFlip({ from: shown, to: shown + Math.sign(page - shown) });
  }, [page, shown, flip]);

  useLayoutEffect(() => {
    const L = (s: number) => textures[s * 2];
    const R = (s: number) => textures[s * 2 + 1];
    if (flip) {
      const forward = flip.to > flip.from;
      mats.left.uniforms.uFront.value = forward ? L(flip.from) : L(flip.to);
      mats.right.uniforms.uFront.value = forward ? R(flip.to) : R(flip.from);
      mats.flip.uniforms.uFront.value = forward ? R(flip.from) : R(flip.to);
      mats.flip.uniforms.uBack.value = forward ? L(flip.to) : L(flip.from);
      pivot.current.rotation.z = forward ? 0 : Math.PI;
      pivot.current.visible = true;
    } else {
      mats.left.uniforms.uFront.value = L(shown);
      mats.right.uniforms.uFront.value = R(shown);
      pivot.current.visible = false;
    }
    mats.left.uniforms.uBack.value = mats.left.uniforms.uFront.value;
    mats.right.uniforms.uBack.value = mats.right.uniforms.uFront.value;
  }, [flip, shown, textures, mats]);

  useFrame((_, dt) => {
    if (!flip) return;
    progress.current = Math.min(1, progress.current + dt / FLIP_SECONDS);
    const t = progress.current;
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const forward = flip.to > flip.from;
    pivot.current.rotation.z = (forward ? eased : 1 - eased) * Math.PI;
    mats.flip.uniforms.uShade.value = 1 - 0.12 * Math.sin(eased * Math.PI);
    if (t >= 1) {
      setShown(flip.to);
      setFlip(null);
    }
  });

  return (
    <group position={[-2.22, COUNTER_TOP, -2.44]} rotation-y={0.04} scale={0.75}>
      <RBox
        args={[PAGE_W * 2 + 0.08, 0.03, PAGE_D + 0.06]}
        position-y={0.015}
        material={sharedMaterials().fabric(roomTheme().book)}
        radius={0.01}
        {...cover.handlers}
      />
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * PAGE_W) / 2, 0.045, 0]} castShadow>
          <boxGeometry args={[PAGE_W - 0.01, 0.03, PAGE_D - 0.01]} />
          <meshStandardMaterial color="#efe4cc" />
        </mesh>
      ))}
      <mesh geometry={pageGeometry} material={mats.left} position={[-PAGE_W, 0.061, 0]} {...left.handlers} />
      <mesh geometry={pageGeometry} material={mats.right} position={[0, 0.061, 0]} {...right.handlers} />
      <group ref={pivot} position={[0, 0.063, 0]}>
        <mesh geometry={pageGeometry} material={mats.flip} />
      </group>
      {/* Ribbon bookmark */}
      <mesh position={[0.05, 0.062, PAGE_D / 2 + 0.08]}>
        <boxGeometry args={[0.03, 0.002, 0.18]} />
        <meshStandardMaterial color="#ffc93c" />
      </mesh>
    </group>
  );
}
