'use client';

import { Html } from '@react-three/drei';
import { setView, useStore, type Zone } from '@/lib/store';

const MARKERS: { zone: Zone; label: string; position: [number, number, number] }[] = [
  // Each dot sits on the object it opens, so none float in empty air.
  { zone: 'experience', label: 'Experience', position: [-2.05, 1.94, -2.0] },
  { zone: 'projects', label: 'Projects', position: [-4.5, 1.0, -0.33] },
  { zone: 'interests', label: 'Interests', position: [3.6, 1.05, -2.15] }, // on the turntable
  { zone: 'about', label: 'About', position: [1.2, 2.76, -2.72] },
  { zone: 'resume', label: 'Résumé', position: [0.7, 1.17, -2.5] },
];

/** Quiet hotspots: a softly pulsing dot whose label shows on hover or focus. */
export function Markers() {
  const view = useStore((s) => s.view);
  const ready = useStore((s) => s.ready);
  if (view !== 'overview' || !ready) return null;
  return (
    <>
      {MARKERS.map((m, i) => (
        <Html key={m.zone} position={m.position} center zIndexRange={[40, 20]}>
          <button
            type="button"
            className="hotspot"
            style={{ animationDelay: `${i * 0.4}s` }}
            aria-label={m.label}
            onClick={() => setView(m.zone)}
          >
            <span className="hotspot-dot" aria-hidden="true" />
            <span className="hotspot-label">{m.label}</span>
          </button>
        </Html>
      ))}
    </>
  );
}
