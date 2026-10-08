import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { getState, setState, setView, useStore, type Zone } from '@/lib/store';

export const ZONE_HINT: Record<Zone, string> = {
  about: 'About me',
  experience: 'Experience: load a game',
  projects: 'Projects: open the cookbook',
  interests: 'Interests: spin a record',
  resume: 'Résumé',
};

/**
 * Pointer handling for an object that belongs to a zone of the room.
 * From anywhere else, clicking flies the camera to the zone; once there,
 * clicking runs `onActivate` (insert a disc, turn a page, play a record...).
 */
export function useInteractive(zone: Zone, label?: string, onActivate?: () => void) {
  const [hovered, setHovered] = useState(false);
  const view = useStore((s) => s.view);
  const clickable = view !== zone || !!onActivate;
  useCursor(hovered && clickable);

  const handlers = {
    onPointerOver(e: ThreeEvent<PointerEvent>) {
      e.stopPropagation();
      setHovered(true);
      const inZone = getState().view === zone;
      setState({ hovered: inZone ? (onActivate ? label ?? null : null) : ZONE_HINT[zone] });
    },
    onPointerOut() {
      setHovered(false);
      setState({ hovered: null });
    },
    onClick(e: ThreeEvent<MouseEvent>) {
      e.stopPropagation();
      if (getState().view !== zone) setView(zone);
      else onActivate?.();
    },
  };

  return { hovered: hovered && clickable, handlers };
}
