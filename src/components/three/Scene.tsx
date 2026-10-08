'use client';

import { Suspense, useLayoutEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { setState } from '@/lib/store';
import { roomTheme } from '@/lib/themes';
import { Arcade } from './Arcade';
import { Bed } from './Bed';
import { Kitchen } from './Kitchen';
import { CameraRig } from './CameraRig';
import { Desk } from './Desk';
import { Markers } from './Markers';
import { RecipeBook } from './RecipeBook';
import { Room } from './Room';
import { Vinyl } from './Vinyl';
import { WallDecor } from './WallDecor';

const T = roomTheme();
/** Left wall, fridge toward the front, ending well short of the TV credenza. */
const KITCHEN_OFFSET: [number, number, number] = [-2.2, 0, -2.55];
/** Right wall, headboard against it, clear of the hi-fi in the back corner. */
const BED_OFFSET: [number, number, number] = [2.2, 0, 0.8];
/** Back wall, right of the corkboard: turntable credenza with the record shelves above. */
const HIFI_OFFSET: [number, number, number] = [0.4, 0, 0];
const BACKGROUND = T.background;

function Lights() {
  return (
    <>
      {/* Soft studio reflections for the brass, chrome and lacquer */}
      <Environment resolution={256} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={2} color="#fff0dc" position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[12, 8, 1]} />
        <Lightformer form="rect" intensity={1.2} color={T.lights.sun} position={[7, 3, 6]} rotation-y={-Math.PI / 4} scale={[6, 4, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#cfdcff" position={[-7, 2, 6]} rotation-y={Math.PI / 4} scale={[6, 4, 1]} />
      </Environment>
      <hemisphereLight args={[T.lights.sky, T.lights.ground, T.lights.hemi * 0.4]} />
      <ambientLight intensity={T.lights.ambient * 0.3} />
      {/* Key light from the open front (both side walls would block a side sun) */}
      <directionalLight
        position={[1.5, 8, 8]}
        intensity={T.lights.sunIntensity * 1.1}
        color={T.lights.sun}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
    </>
  );
}

/** Mounts only after every suspended texture inside the same boundary has loaded. */
function Ready() {
  const { gl, scene, camera, setFrameloop } = useThree();
  useLayoutEffect(() => {
    let live = true;
    // Hold rendering and compile every shader in the background
    // (KHR_parallel_shader_compile), so the page never freezes on a synchronous
    // first-frame compile; the loader stays up until it's done.
    setFrameloop('never');
    gl.compileAsync(scene, camera)
      .catch(() => {})
      .then(() => {
        if (!live) return;
        setFrameloop('always');
        setState({ ready: true });
      });
    return () => {
      live = false;
      setFrameloop('always');
    };
  }, [gl, scene, camera, setFrameloop]);
  return null;
}

export default function Scene() {
  return (
    <Canvas
      shadows
      flat
      dpr={[1, 1.75]}
      camera={{ fov: 40, near: 0.1, far: 80, position: [10, 12, 22] }}
      onPointerMissed={() => setState({ hovered: null })}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 20, 45]} />
      <Lights />
      <Suspense fallback={null}>
        <Room />
        {/* Kitchen and bed are authored against the back wall (z = -2.8) and
            turned onto the side walls here. */}
        <group position={KITCHEN_OFFSET} rotation-y={Math.PI / 2}>
          <Kitchen />
          <RecipeBook />
        </group>
        <group position={BED_OFFSET} rotation-y={-Math.PI / 2}>
          <Bed />
        </group>
        <group position={HIFI_OFFSET}>
          <Vinyl />
        </group>
        <Arcade />
        <Desk />
        <WallDecor />
        <Markers />
        <Ready />
      </Suspense>
      <CameraRig />
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={0.5} distanceFalloff={0.5} intensity={2.2} quality="medium" halfRes />
        {/* Only genuinely bright things glow (lamp shades, screens); paper and walls don't. */}
        <Bloom mipmapBlur luminanceThreshold={1.4} intensity={0.6} />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette offset={0.3} darkness={0.45} />
      </EffectComposer>
    </Canvas>
  );
}
