'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { experience } from '@/data/content';
import { FONTS, ctxOf, drawLogo, fitFont, ensureFonts, loadImage, makeCanvasTexture, useCanvasTexture } from '@/lib/canvas';
import { getState, setState, turnCrtPage, useStore } from '@/lib/store';
import { Credenza, RBox } from './materials';
import { crtFragment, crtVertex, drawCrt, type CrtMode } from './crt';
import { useInteractive } from './useInteractive';
import { GAME_POSTERS, Posters } from './Posters';
import { Q_FLAT, Q_UPRIGHT, WALL_Z, Y_AXIS, smooth } from './util';

const INK = '#15122b';
const TOP = 0.7;
const PAGE_SECONDS = 8;
// Credenza with the TV in the middle, console to its left and the games to its right.
const STAND = { x: -2.9, z: -2.3, w: 3.7, d: 0.85 };
// Late-'90s silver CRT: a shallow bezel in front of a deep tapered back.
const TV = { x: -2.9, front: -1.825, w: 1.3, h: 1.12, bezelD: 0.14, backD: 0.72 };
const TV_FRONT = TV.front;
const SCREEN = { x: TV.x, y: TOP + 0.6, w: 1.0, h: 0.75 };
const CONSOLE = { x: -4.05, z: -2.2, w: 0.8, h: 0.17, d: 0.55 };
const SLOT = new THREE.Vector3(CONSOLE.x, TOP + 0.1, CONSOLE.z + CONSOLE.d / 2);
const CASE = { w: 0.36, h: 0.46, d: 0.04, lean: -0.3, z: -2.3 };
const caseX = (i: number) => -2.02 + i * 0.37;

/** Insert progress per disc: 0 = in its case, 1 = fully inside the console. Shared with the CRT. */
const discProgress = experience.map(() => 0);

/** True once a disc has fully gone into the console (the camera then moves in on the TV). */
export const isDiscLoaded = () => discProgress.some((p) => p >= 1);

// Laid out against the back wall (z = -2.8), in the corner beside the kitchen.
export function Arcade() {
  return (
    <group position={[0.85, 0, 0]}>
      <Stand />
      <Posters x={TV.x} z={WALL_Z + 0.02} designs={GAME_POSTERS} zone="experience" />
      <Tv />
      <Console />
      {experience.map((_, i) => (
        <GameCase key={i} index={i} />
      ))}
      {experience.map((_, i) => (
        <Disc key={i} index={i} />
      ))}
    </group>
  );
}

function Stand() {
  return <Credenza w={STAND.w} h={TOP} d={STAND.d} legH={0.18} position={[STAND.x, 0, STAND.z]} />;
}

function Tv() {
  const texture = useMemo(() => {
    const t = makeCanvasTexture(1024, 768);
    // No mipmaps: the screen is seen close to 1:1, and mipmapping blurs small text.
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    return t;
  }, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: texture }, uTime: { value: 0 }, uPower: { value: 0 } },
        vertexShader: crtVertex,
        fragmentShader: crtFragment,
        toneMapped: false,
      }),
    [texture],
  );
  const lastKey = useRef('');
  const booted = useRef(false);
  const boot = useRef<{ disc: number; start: number } | null>(null);
  // Tapping the screen turns the page of the loaded game.
  const { handlers } = useInteractive('experience', 'Next page', () => turnCrtPage(1, experience.length));

  useEffect(() => {
    // Redraw once the pixel font is ready.
    ensureFonts().then(() => {
      lastKey.current = '';
    });
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const { disc, ready } = getState();
    let mode: CrtMode;
    let key: string;

    if (disc !== null && discProgress[disc] >= 1) {
      if (!boot.current || boot.current.disc !== disc) {
        boot.current = { disc, start: t };
        booted.current = false;
      }
      const progress = (t - boot.current.start) / 1.6;
      if (progress < 1) {
        mode = { kind: 'boot', t: progress };
        key = `boot${Math.floor(progress * 24)}`;
      } else {
        const blink = Math.floor(t * 2) % 2 === 0;
        // Long quest lists turn a page every PAGE_SECONDS, counted from the last turn
        // (so an arrow-key or tap turn restarts the timer).
        const now = performance.now();
        const { crtPage, crtPageAt, crtPages } = getState();
        if (!booted.current) {
          booted.current = true;
          setState({ crtPage: 0, crtPageAt: now });
        } else if (crtPages > 1 && now - crtPageAt > PAGE_SECONDS * 1000) {
          setState({ crtPage: (crtPage + 1) % crtPages, crtPageAt: now });
        }
        const page = getState().crtPage;
        mode = { kind: 'game', index: disc, blink, page };
        key = `game${disc}${blink}${page}`;
      }
    } else {
      boot.current = null;
      if (discProgress.some((p) => p > 0)) {
        const frame = Math.floor(t * 4) % 4;
        mode = { kind: 'reading', frame };
        key = `read${frame}`;
      } else {
        const blink = Math.floor(t * 1.5) % 2 === 0;
        mode = { kind: 'idle', blink };
        key = `idle${blink}`;
      }
    }

    if (key !== lastKey.current) {
      const pageCount = drawCrt(ctxOf(texture), 1024, 768, mode);
      if (mode.kind === 'game' && pageCount !== getState().crtPages) setState({ crtPages: pageCount });
      texture.needsUpdate = true;
      lastKey.current = key;
    }
    material.uniforms.uTime.value = t;
    material.uniforms.uPower.value = THREE.MathUtils.damp(material.uniforms.uPower.value, ready ? 1 : 0, 2.5, dt);
  });

  const local = useMemo(
    () => ({
      silver: new THREE.MeshStandardMaterial({ color: '#b4b7bb', metalness: 0.55, roughness: 0.38 }),
      // The tapered back is a 4-sided frustum, so it wants crisp faceted shading.
      silverBack: new THREE.MeshStandardMaterial({ color: '#a7aaae', metalness: 0.5, roughness: 0.42, flatShading: true }),
      surround: new THREE.MeshStandardMaterial({ color: '#3a3c40', roughness: 0.45 }),
      button: new THREE.MeshStandardMaterial({ color: '#8e9196', metalness: 0.4, roughness: 0.35 }),
      jacks: ['#f2c230', '#f2f2ee', '#d8392b'].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.35 })),
    }),
    [],
  );
  const bezelY = TOP + TV.h / 2;
  const back = { front: 1.2 / 2, back: 0.68 / 2 };

  return (
    <group {...handlers}>
      {/* Silver bezel */}
      <RBox args={[TV.w, TV.h, TV.bezelD]} position={[TV.x, bezelY, TV_FRONT - TV.bezelD / 2]} material={local.silver} radius={0.06} />
      {/* Deep tapered back housing (square frustum, stretched to the tube's proportions) */}
      <group position={[TV.x, bezelY + 0.02, TV_FRONT - TV.bezelD - TV.backD / 2]} scale={[1, 0.86, 1]}>
        <group rotation-x={Math.PI / 2}>
          <mesh rotation-y={Math.PI / 4} material={local.silverBack} castShadow receiveShadow>
            <cylinderGeometry args={[back.front * Math.SQRT2, back.back * Math.SQRT2, TV.backD, 4, 1]} />
          </mesh>
        </group>
      </group>
      {/* Charcoal surround and the tube */}
      <RBox args={[SCREEN.w + 0.11, SCREEN.h + 0.1, 0.02]} position={[SCREEN.x, SCREEN.y, TV_FRONT + 0.002]} material={local.surround} radius={0.04} />
      <mesh position={[SCREEN.x, SCREEN.y, TV_FRONT + 0.014]} material={material}>
        <planeGeometry args={[SCREEN.w, SCREEN.h]} />
      </mesh>

      {/* Front control strip: buttons, AV jacks, power light */}
      {Array.from({ length: 5 }, (_, i) => (
        <RBox
          key={i}
          args={[0.035, 0.016, 0.012]}
          position={[TV.x - 0.42 + i * 0.05, TOP + 0.09, TV_FRONT + 0.004]}
          material={local.button}
          radius={0.005}
        />
      ))}
      {local.jacks.map((mat, i) => (
        <mesh key={i} position={[TV.x + 0.05 + i * 0.045, TOP + 0.09, TV_FRONT + 0.008]} rotation-x={Math.PI / 2} material={mat}>
          <cylinderGeometry args={[0.012, 0.012, 0.016, 20]} />
        </mesh>
      ))}
      <mesh position={[TV.x + 0.5, TOP + 0.09, TV_FRONT + 0.006]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshBasicMaterial color="#7dff6a" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A fat black slab in the spirit of a 2000-era console: two tiers, grooved front, slot and ports. */
function Console() {
  const disc = useStore((s) => s.disc);
  const { handlers } = useInteractive('experience', 'Eject disc', () => setState({ disc: null }));
  const local = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: '#16171a', metalness: 0.25, roughness: 0.32 }),
      groove: new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.7 }),
      port: new THREE.MeshStandardMaterial({ color: '#2f6bd8', roughness: 0.4 }),
    }),
    [],
  );
  const front = CONSOLE.d / 2;
  const BASE_H = 0.06;
  const BODY_H = CONSOLE.h - BASE_H;

  return (
    <group position={[CONSOLE.x, TOP, CONSOLE.z]} {...handlers}>
      {/* Recessed lower tier with a vent and the blue port block */}
      <RBox args={[CONSOLE.w - 0.03, BASE_H, CONSOLE.d - 0.04]} position={[0, BASE_H / 2, -0.02]} material={local.body} radius={0.006} />
      <RBox args={[0.32, 0.026, 0.004]} position={[0.02, BASE_H / 2, front - 0.04 + 0.001]} material={local.groove} radius={0.002} />
      <RBox args={[0.075, 0.034, 0.008]} position={[-0.32, BASE_H / 2, front - 0.04 + 0.002]} material={local.port} radius={0.004} />

      {/* Upper tier, with horizontal grooves across the face */}
      <RBox args={[CONSOLE.w, BODY_H, CONSOLE.d]} position={[0, BASE_H + BODY_H / 2, 0]} material={local.body} radius={0.008} />
      {[0.072, 0.128, 0.152].map((y) => (
        <RBox key={y} args={[CONSOLE.w - 0.012, 0.004, 0.004]} position={[0, y, front + 0.001]} material={local.groove} radius={0.001} />
      ))}
      {/* Disc slot (the disc slides in here) */}
      <RBox args={[0.34, 0.012, 0.006]} position={[0.02, SLOT.y - TOP, front + 0.002]} material={local.groove} radius={0.003} />

      {/* Power and eject buttons with their lights */}
      {[0.125, 0.09].map((y, i) => (
        <group key={y} position={[CONSOLE.w / 2 - 0.045, y, front + 0.002]}>
          <RBox args={[0.045, 0.024, 0.008]} material={local.body} radius={0.004} />
          <mesh position={[-0.012, 0, 0.005]}>
            <sphereGeometry args={[0.004, 10, 10]} />
            <meshBasicMaterial
              color={i === 0 ? (disc !== null ? '#3dff8a' : '#ff3b3b') : '#3a8bff'}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

async function drawCaseCover(ctx: CanvasRenderingContext2D, w: number, h: number, index: number) {
  const exp = experience[index];
  ctx.fillStyle = exp.color;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, 70);
  ctx.fillStyle = '#fff';
  ctx.font = `400 44px ${FONTS.pixel}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('NOAH STATION', 24, 37);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.roundRect(40, 100, w - 80, 300, 18);
  ctx.fill();
  let drewLogo = false;
  if (exp.logo) {
    try {
      drawLogo(ctx, await loadImage(exp.logo), 64, 124, w - 128, 252);
      drewLogo = true;
    } catch {
      // Falls through to the wordmark below.
    }
  }
  if (!drewLogo) {
    // No logo image: set the company name as a wordmark in its colour.
    const name = exp.company.replace(/\s*\(.*\)$/, '');
    ctx.fillStyle = exp.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitFont(ctx, name, w - 140, 96, 40, (s) => `800 ${s}px ${FONTS.display}`);
    ctx.fillText(name, w / 2, 250);
  }

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 64px ${FONTS.display}`;
  ctx.fillText(exp.short, w / 2, 485);
  ctx.font = `400 38px ${FONTS.pixel}`;
  ctx.fillText(exp.year, w / 2, 535);

  ctx.fillStyle = '#fff';
  ctx.fillRect(24, h - 110, 70, 86);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(24, h - 110, 70, 86);
  ctx.fillStyle = INK;
  ctx.font = `800 56px ${FONTS.display}`;
  ctx.fillText('E', 59, h - 46);
  ctx.textAlign = 'right';
  ctx.font = `400 34px ${FONTS.pixel}`;
  ctx.fillText(`DISC ${index + 1}`, w - 28, h - 40);
}

function GameCase({ index }: { index: number }) {
  const exp = experience[index];
  const disc = useStore((s) => s.disc);
  const cover = useCanvasTexture(512, 656, (ctx, w, h) => drawCaseCover(ctx, w, h, index), [index]);
  const { hovered, handlers } = useInteractive('experience', `Load ${exp.company}`, () => setState({ disc: index }));
  const materials = useMemo(() => {
    const shell = new THREE.MeshStandardMaterial({ color: '#1b1b2a', roughness: 0.4 });
    const front = new THREE.MeshStandardMaterial({ map: cover, roughness: 0.35 });
    return [shell, shell, shell, shell, front, shell];
  }, [cover]);
  const ref = useRef<THREE.Group>(null!);

  useFrame((_, dt) => {
    const lift = hovered || disc === index ? 0.06 : 0;
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, TOP + lift, 10, dt);
  });

  return (
    <group ref={ref} position={[caseX(index), TOP, CASE.z]} rotation-x={CASE.lean}>
      <mesh position-y={CASE.h / 2} material={materials} castShadow {...handlers}>
        <boxGeometry args={[CASE.w, CASE.h, CASE.d]} />
      </mesh>
    </group>
  );
}

function drawDiscLabel(ctx: CanvasRenderingContext2D, w: number, _h: number, index: number) {
  const exp = experience[index];
  const c = w / 2;
  const silver = ctx.createRadialGradient(c, c, w * 0.1, c, c, w * 0.5);
  silver.addColorStop(0, '#f4f6fa');
  silver.addColorStop(1, '#c9d2de');
  ctx.fillStyle = silver;
  ctx.fillRect(0, 0, w, w);

  ctx.fillStyle = exp.color;
  ctx.beginPath();
  ctx.arc(c, c, w * 0.48, 0, Math.PI * 2);
  ctx.arc(c, c, w * 0.3, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 46px ${FONTS.display}`;
  ctx.fillText(exp.short, c, c - w * 0.39);
  ctx.font = `400 36px ${FONTS.pixel}`;
  ctx.fillText(exp.year, c, c + w * 0.39);

  ctx.fillStyle = '#9aa3ad';
  ctx.beginPath();
  ctx.arc(c, c, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(c, c, w * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

function Disc({ index }: { index: number }) {
  const label = useCanvasTexture(512, 512, (ctx, w, h) => drawDiscLabel(ctx, w, h, index), [index]);
  const materials = useMemo(() => {
    const silver = new THREE.MeshPhysicalMaterial({
      color: '#d7dde6',
      metalness: 0.9,
      roughness: 0.15,
      iridescence: 1,
      iridescenceIOR: 1.6,
    });
    return [silver, new THREE.MeshStandardMaterial({ map: label, roughness: 0.4 }), silver];
  }, [label]);
  const ref = useRef<THREE.Group>(null!);
  const spin = useMemo(() => new THREE.Quaternion(), []);

  // Out of the case, arc over to the console, then slide into the slot.
  const path = useMemo(() => {
    const home = new THREE.Vector3(0, CASE.h * 0.5, CASE.d / 2 + 0.01)
      .applyEuler(new THREE.Euler(CASE.lean, 0, 0))
      .add(new THREE.Vector3(caseX(index), TOP, CASE.z));
    // Lift out of the case and forward, clear of the TV's front face, then glide
    // across in front of the screen to the console (the TV sits between the two).
    const clearZ = TV_FRONT + 0.3;
    const risen = new THREE.Vector3(home.x, home.y + 0.35, clearZ);
    const front = SLOT.clone().add(new THREE.Vector3(0, 0, 0.35));
    const across = new THREE.Vector3((risen.x + front.x) / 2, TOP + 0.75, clearZ + 0.05);
    const inside = SLOT.clone().add(new THREE.Vector3(0, 0, -0.32));
    return { home, risen, front, inside, curve: new THREE.CatmullRomCurve3([risen, across, front]) };
  }, [index]);

  useFrame((_, dt) => {
    let p = discProgress[index];
    if (getState().disc === index) {
      // Wait for any other disc to finish ejecting before going in.
      const slotBusy = discProgress.some((v, j) => j !== index && v > 0);
      if (!slotBusy) p = Math.min(1, p + dt / 1.7);
    } else {
      p = Math.max(0, p - dt / 1.1);
    }
    discProgress[index] = p;

    const g = ref.current;
    g.visible = p > 0 && p < 1;
    if (!g.visible) return;

    let flat = 0;
    if (p < 0.2) {
      g.position.lerpVectors(path.home, path.risen, smooth(p / 0.2));
    } else if (p < 0.75) {
      flat = smooth((p - 0.2) / 0.55);
      path.curve.getPoint(flat, g.position);
    } else {
      flat = 1;
      g.position.lerpVectors(path.front, path.inside, smooth((p - 0.75) / 0.25));
    }
    g.quaternion.slerpQuaternions(Q_UPRIGHT, Q_FLAT, flat).multiply(spin.setFromAxisAngle(Y_AXIS, p * 10));
  });

  return (
    <group ref={ref}>
      <mesh material={materials} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.006, 48]} />
      </mesh>
    </group>
  );
}
