'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { profile } from '@/data/content';
import { FONTS, rng, useCanvasTexture } from '@/lib/canvas';
import { roomTheme } from '@/lib/themes';
import { Leg, Pull, RBox, SlatFront, mats } from './materials';
import { useInteractive } from './useInteractive';
import { WALL_Z } from './util';

const T = roomTheme();
const DESK = { w: 1.4, d: 0.65, h: 0.74 };

/** The monitor shows the résumé open in a document window. */
function drawScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#2b3a3a');
  bg.addColorStop(1, '#3f5e5a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Menu bar
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, w, 28);
  ctx.fillStyle = '#efe3cc';
  ctx.font = `500 16px ${FONTS.display}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(profile.handle, 16, 15);

  // Document window
  const x = 130;
  const y = 54;
  const ww = w - 260;
  const wh = h - 80;
  ctx.fillStyle = '#e8e2d6';
  ctx.fillRect(x, y, ww, 30);
  ctx.fillStyle = '#2b2118';
  ctx.font = `500 15px ${FONTS.display}`;
  ctx.fillText(profile.resume.replace(/^\//, ''), x + 70, y + 16);
  ['#e0645a', '#e0b44a', '#6cc06a'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + 16 + i * 18, y + 15, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y + 30, ww, wh - 30);

  ctx.fillStyle = '#2b2118';
  ctx.font = `600 30px ${FONTS.display}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(profile.name.toUpperCase(), x + 40, y + 84);
  ctx.fillStyle = '#c9622d';
  ctx.fillRect(x + 40, y + 98, ww - 80, 3);
  const rand = rng(21);
  let ly = y + 130;
  for (const section of ['EXPERIENCE', 'PROJECTS', 'EDUCATION']) {
    ctx.fillStyle = '#2b2118';
    ctx.font = `600 15px ${FONTS.display}`;
    ctx.fillText(section, x + 40, ly);
    ly += 14;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#d5d0c8';
      ctx.fillRect(x + 40, ly, (ww - 80) * (0.5 + rand() * 0.45), 7);
      ly += 16;
    }
    ly += 18;
  }
}

/** Front-right workstation: walnut desk, monitor, keyboard, tower and a shell office chair. */
export function Desk() {
  const m = mats();
  const { handlers } = useInteractive('resume');
  const screen = useCanvasTexture(1024, 600, drawScreen);
  const local = useMemo(
    () => ({
      plastic: new THREE.MeshStandardMaterial({ color: '#1c1d20', roughness: 0.4, metalness: 0.2 }),
      keys: new THREE.MeshStandardMaterial({ color: '#d9d3c9', roughness: 0.5 }),
      screen: new THREE.MeshBasicMaterial({ map: screen, toneMapped: false }),
      shell: m.fabric(T.beanbag),
    }),
    [m, screen],
  );

  return (
    // Against the back wall, under the portrait.
    <group position={[0.8, 0, WALL_Z + DESK.d / 2 + 0.04]} {...handlers}>
      {/* Desk */}
      <RBox args={[DESK.w, 0.04, DESK.d]} position-y={DESK.h} material={m.walnut} radius={0.012} />
      <RBox args={[0.42, 0.18, DESK.d - 0.06]} position={[0.42, DESK.h - 0.11, 0]} material={m.walnut} radius={0.01} />
      <SlatFront w={0.4} h={0.16} position={[0.42, DESK.h - 0.11, (DESK.d - 0.06) / 2 + 0.008]} />
      <Pull position={[0.57, DESK.h - 0.11, (DESK.d - 0.06) / 2 + 0.035]} length={0.1} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Leg
          key={`${sx}${sz}`}
          position={[sx * (DESK.w / 2 - 0.08), 0, sz * (DESK.d / 2 - 0.07)]}
          height={DESK.h - 0.02}
          splay={[-sx * 0.08, sz * 0.08]}
          material={m.walnut}
        />
      ))}

      {/* Monitor */}
      <group position={[-0.1, DESK.h + 0.02, -0.12]}>
        <RBox args={[0.22, 0.012, 0.16]} position-y={0.006} material={local.plastic} radius={0.005} />
        <RBox args={[0.04, 0.2, 0.03]} position={[0, 0.11, -0.03]} material={local.plastic} radius={0.01} />
        <RBox args={[0.66, 0.4, 0.03]} position={[0, 0.39, 0]} material={local.plastic} radius={0.012} />
        <mesh position={[0, 0.39, 0.016]} material={local.screen}>
          <planeGeometry args={[0.62, 0.36]} />
        </mesh>
      </group>

      {/* Keyboard, mouse and a mug */}
      <RBox args={[0.42, 0.018, 0.14]} position={[-0.1, DESK.h + 0.03, 0.14]} material={local.keys} radius={0.006} />
      <RBox args={[0.06, 0.02, 0.1]} position={[0.22, DESK.h + 0.03, 0.15]} material={local.keys} radius={0.02} />
      <group position={[0.5, DESK.h + 0.02, -0.1]}>
        <mesh position-y={0.06} material={m.ceramic(T.mug)} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.11, 28]} />
        </mesh>
      </group>

      {/* PC tower on the floor */}
      <group position={[-0.5, 0, -0.02]}>
        <RBox args={[0.2, 0.45, 0.45]} position-y={0.225} material={local.plastic} radius={0.012} />
        <mesh position={[0, 0.4, 0.227]}>
          <sphereGeometry args={[0.006, 10, 10]} />
          <meshBasicMaterial color="#5ab0ff" toneMapped={false} />
        </mesh>
      </group>

      {/* Shell office chair on a five-star chrome base */}
      <group position={[0.05, 0, 0.62]} rotation-y={Math.PI + 0.1}>
        <RBox args={[0.48, 0.05, 0.44]} position-y={0.46} material={local.shell} radius={0.02} />
        <RBox args={[0.48, 0.36, 0.05]} position={[0, 0.68, -0.21]} rotation-x={-0.18} material={local.shell} radius={0.02} />
        <mesh position-y={0.25} material={m.chrome}>
          <cylinderGeometry args={[0.022, 0.022, 0.4, 12]} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <group key={i} rotation-y={a}>
              <RBox args={[0.03, 0.02, 0.28]} position={[0, 0.06, 0.14]} material={m.chrome} radius={0.008} />
              <mesh position={[0, 0.025, 0.27]} material={local.plastic}>
                <sphereGeometry args={[0.022, 12, 12]} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}
