'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { profile } from '@/data/content';import Hud from './Hud';
import PlainContent from './PlainContent';

// three.js only runs in the browser, so the room is never server-rendered.
const Scene = dynamic(() => import('./three/Scene'), { ssr: false });

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Site() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useEffect(() => setWebgl(hasWebGL()), []);

  if (webgl === false) {
    return (
      <main className="plain">
        <h1>{profile.name}</h1>
        <PlainContent />
      </main>
    );
  }

  return (
    <main>
      <div className="sr-only">
        <PlainContent />
      </div>
      <div className="stage">{webgl && <Scene />}</div>
      <Hud />
    </main>
  );
}
