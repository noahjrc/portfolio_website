'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  FiArrowLeft,
  FiChevronRight,
  FiDownload,
  FiGithub,
  FiLinkedin,
  FiMail,
  FiPause,
  FiPlay,
  FiShuffle,
  FiSquare,
  FiVolume1,
  FiVolume2,
  FiVolumeX,
  FiX,
} from 'react-icons/fi';
import { albums, experience, profile, projects } from '@/data/content';
import { canSetVolume, ejectRecord, loadSavedVolume, placeYoutube, playAlbum, setVolume, shuffleAlbum, togglePlayback } from '@/lib/player';
import { getState, setState, setView, turnCrtPage, useStore, type PlayerStatus, type Zone } from '@/lib/store';

const NAV: { view: Zone; label: string }[] = [
  { view: 'about', label: 'About' },
  { view: 'experience', label: 'Experience' },
  { view: 'projects', label: 'Projects' },
  { view: 'interests', label: 'Interests' },
  { view: 'resume', label: 'Résumé' },
];

const SPREADS = projects.length + 1;

export default function Hud() {
  const view = useStore((s) => s.view);
  const ready = useStore((s) => s.ready);
  useKeyboard();
  useEffect(loadSavedVolume, []);

  return (
    <div className="hud">
      <div className={`loader ${ready ? 'is-done' : ''}`} aria-hidden={ready}>
        <p className="loader-name">Noah Colbourne</p>
        <div className="loader-bar" />
      </div>

      <header className="topbar">
        <button type="button" className="wordmark" onClick={() => setView('overview')}>
          <span className="wordmark-name">Noah Colbourne</span>
          <span className="wordmark-sub">Computer Engineering</span>
        </button>
        <nav className="nav" aria-label="Sections">
          {NAV.map((n) => (
            <button
              key={n.view}
              type="button"
              className="nav-link"
              aria-current={view === n.view ? 'page' : undefined}
              onClick={() => setView(n.view)}
            >
              {n.label}
            </button>
          ))}
          <span className="nav-divider" aria-hidden="true" />
          <a className="icon-link" href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <FiGithub />
          </a>
          <a className="icon-link" href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FiLinkedin />
          </a>
          <a className="icon-link" href={`mailto:${profile.email}`} aria-label={`Email ${profile.email}`}>
            <FiMail />
          </a>
        </nav>
      </header>

      {view !== 'overview' && (
        <button type="button" className="back-link" onClick={() => setView('overview')}>
          <FiArrowLeft /> Back to the room <kbd>Esc</kbd>
        </button>
      )}

      {view === 'overview' && <Intro />}
      {view === 'about' && <AboutPanel />}
      {view === 'experience' && <ExperiencePanel />}
      {view === 'projects' && <ProjectsPanel />}
      {view === 'interests' && <InterestsPanel />}
      {view === 'resume' && <ResumeModal />}
      <MiniPlayer />
      <Tooltip />
    </div>
  );
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = getState();
      if (e.key === 'Escape') {
        setView('overview');
        return;
      }
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      if (s.view === 'projects') {
        setState({ page: Math.min(SPREADS - 1, Math.max(0, s.page + dir)) });
      } else if (s.view === 'experience') {
        // Page through the loaded game; past either end, move on to the next game.
        const n = experience.length;
        if (!turnCrtPage(dir, n, true)) setState({ disc: dir > 0 ? 0 : n - 1 });
      } else if (s.view === 'interests') {
        const n = albums.length;
        playAlbum(s.album === null ? 0 : (s.album + dir + n) % n);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function Intro() {
  return (
    <section className="intro">
      <p className="eyebrow">B.Eng. Computer Engineering · Memorial University · 2026</p>
      <h1 className="intro-title">
        Noah <em>Colbourne</em>
      </h1>
      <p className="intro-text">
        Computer Engineering graduate and full-stack developer. Welcome to my apartment. Everything here says
        something about me, so have a look around.
      </p>
      <p className="intro-hint">Click anything in the room, or use the menu above.</p>
    </section>
  );
}

function AboutPanel() {
  return (
    <section className="panel panel-side">
      <p className="eyebrow">About</p>
      <h2>{profile.name}</h2>
      <p className="panel-body">{profile.bio}</p>
      <ul className="contact-list">
        <li>
          <FiMail /> <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        <li>
          <FiGithub />{' '}
          <a href={profile.github} target="_blank" rel="noopener noreferrer">
            github.com/noahjrc
          </a>
        </li>
        <li>
          <FiLinkedin />{' '}
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
            linkedin.com/in/noah-colbourne
          </a>
        </li>
      </ul>
      <button type="button" className="text-button" onClick={() => setView('resume')}>
        Read my résumé <FiChevronRight />
      </button>
    </section>
  );
}

/**
 * The TV and game cases are the interface here, so nothing is drawn on top.
 * Keyboard and screen-reader users still get the games as buttons and the
 * loaded role read aloud.
 */
function ExperiencePanel() {
  const disc = useStore((s) => s.disc);
  const current = disc !== null ? experience[disc] : null;
  return (
    <>
      <section className="sr-only" aria-label="Experience">
        {experience.map((e, i) => (
          <button key={e.company} type="button" aria-pressed={disc === i} onClick={() => setState({ disc: i })}>
            Load {e.company}
          </button>
        ))}
        <p aria-live="polite">
          {current ? `${current.role} at ${current.company}, ${current.dates}. ${current.bullets.join(' ')}` : ''}
        </p>
      </section>
      {/* Phones only (see CSS): the TV close-up leaves the console's eject button off-screen. */}
      {current && (
        <button type="button" className="eject-button" onClick={() => setState({ disc: null })}>
          <FiSquare /> Eject
        </button>
      )}
    </>
  );
}

function ProjectsPanel() {
  const page = useStore((s) => s.page);
  const project = page > 0 ? projects[page - 1] : null;
  // The book itself says to tap a page, so this panel is for screen readers only.
  return (
    <section className="sr-only" aria-label="Projects">
      <button type="button" disabled={page === 0} onClick={() => setState({ page: page - 1 })}>
        Previous page
      </button>
      <p aria-live="polite">
        {project
          ? `Recipe ${page} of ${projects.length}: ${project.title}. ${project.kind}. Built with ${project.stack.join(', ')}. ${project.steps.join(' ')}`
          : 'The cookbook: contents'}
      </p>
      <button type="button" disabled={page === SPREADS - 1} onClick={() => setState({ page: page + 1 })}>
        Next page
      </button>
    </section>
  );
}

const STATUS_TEXT: Record<PlayerStatus, string> = {
  idle: '',
  loading: 'Dropping the needle',
  playing: 'Now playing',
  paused: 'Paused',
  ended: 'Preview over',
  unavailable: 'No preview available',
};

/** Reserves room in the card and keeps the YouTube player laid over it. */
function YoutubeSlot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const follow = () => {
      if (ref.current) placeYoutube(ref.current.getBoundingClientRect());
      frame = requestAnimationFrame(follow);
    };
    follow();
    return () => {
      cancelAnimationFrame(frame);
      placeYoutube(null);
    };
  }, []);
  return <div ref={ref} className="yt-slot" />;
}

function InterestsPanel() {
  const album = useStore((s) => s.album);
  const status = useStore((s) => s.status);
  const track = useStore((s) => s.track);
  const current = album !== null ? albums[album] : null;

  if (!current) {
    return (
      <section className="panel panel-row">
        <div className="panel-row-text">
          <p className="eyebrow">Interests</p>
          <h2>Pick a record off the shelf</h2>
        </div>
        <button type="button" className="round-button" aria-label="Shuffle" onClick={shuffleAlbum}>
          <FiShuffle />
        </button>
      </section>
    );
  }

  return (
    <section className="panel now-playing">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current.coverImage} alt="" className="np-cover" />
      <div className="np-info">
        <p className="eyebrow" aria-live="polite">
          {STATUS_TEXT[status]}
        </p>
        <h2 title={current.title}>{current.title}</h2>
        <p className="np-artist">
          {current.artist}
          {track ? ` · ${track.name}` : ''}
        </p>
      </div>
      <div className="np-controls">
        <button
          type="button"
          className="round-button"
          aria-label={status === 'playing' ? 'Pause' : 'Play'}
          disabled={!track}
          onClick={togglePlayback}
        >
          {status === 'playing' ? <FiPause /> : <FiPlay />}
        </button>
        <button type="button" className="round-button" aria-label="Shuffle" onClick={shuffleAlbum}>
          <FiShuffle />
        </button>
        <button type="button" className="round-button" aria-label="Stop" onClick={ejectRecord}>
          <FiSquare />
        </button>
        {canSetVolume() && <VolumeControl />}
      </div>
      {current.youtube && track && status !== 'unavailable' && <YoutubeSlot />}
      {track?.storeUrl && (
        <a className="np-credit" href={track.storeUrl} target="_blank" rel="noopener noreferrer">
          {current.youtube ? 'Watch on YouTube' : 'Preview courtesy of Apple Music'}
        </a>
      )}
    </section>
  );
}

function VolumeControl() {
  const volume = useStore((s) => s.volume);
  // Remembers the last non-zero level so un-muting goes back to it.
  const lastHeard = useRef(volume || 0.6);
  if (volume > 0) lastHeard.current = volume;
  const muted = volume === 0;
  return (
    <div className="volume">
      <button
        type="button"
        className="volume-icon"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={() => setVolume(muted ? lastHeard.current : 0)}
      >
        {muted ? <FiVolumeX /> : volume < 0.5 ? <FiVolume1 /> : <FiVolume2 />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        aria-label="Volume"
        style={{ '--fill': `${volume * 100}%` } as CSSProperties}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  );
}

function MiniPlayer() {
  const view = useStore((s) => s.view);
  const status = useStore((s) => s.status);
  const album = useStore((s) => s.album);
  if (view === 'interests' || album === null || status !== 'playing') return null;
  return (
    <button type="button" className="mini-player" onClick={() => setView('interests')}>
      <span className="eq" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {albums[album].title}
    </button>
  );
}

function ResumeModal() {
  // Let the camera fly to the corkboard before the résumé opens.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 650);
    return () => clearTimeout(timer);
  }, []);
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={() => setView('overview')}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Résumé" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Résumé</h2>
          <div className="modal-actions">
            <a className="text-button" href={profile.resume} download="Noah_Colbourne_Resume.pdf">
              <FiDownload /> Download PDF
            </a>
            <button type="button" className="round-button" aria-label="Close" onClick={() => setView('overview')}>
              <FiX />
            </button>
          </div>
        </div>
        <iframe src={profile.resume} title="Noah Colbourne's résumé" className="resume-frame" />
        {/* Phone browsers can't show a PDF inside a page, so they get it full screen instead (see CSS). */}
        <div className="resume-mobile">
          <p>Open the PDF to read it full screen.</p>
          <a className="text-button" href={profile.resume} target="_blank" rel="noopener noreferrer">
            Open résumé <FiChevronRight />
          </a>
        </div>
      </div>
    </div>
  );
}

function Tooltip() {
  const hovered = useStore((s) => s.hovered);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return (
    <div ref={ref} className="tooltip" hidden={!hovered} aria-hidden="true">
      {hovered}
    </div>
  );
}
