"use client";

import { useEffect, useRef, useState } from "react";
import { cardPhoto, story } from "@/story";
import type { TourState } from "@/scene/util";
import { Illustration } from "./Illustrations";

export interface OverlayProps {
  tour: TourState;
  auto: boolean;
  music: boolean;
  onStart: () => void;
  onAct: () => void;
  onNext: () => void;
  onBack: () => void;
  onJump: (i: number) => void;
  onToggleAuto: () => void;
  onToggleMusic: () => void;
  onFinale: () => void;
  onAfterLetter: () => void;
  onReplay: () => void;
  onLetter: () => void;
}

const total = story.memories.length;

export function Overlay(p: OverlayProps) {
  const { tour } = p;
  const [menu, setMenu] = useState(false);
  const found = Object.keys(tour.acted).length;
  const memory = story.memories[tour.stopIndex];
  const inWorld = tour.phase === "tour" || tour.phase === "letter" || tour.phase === "gallery" || tour.phase === "finale";
  const photo = cardPhoto(tour.stopIndex);

  return (
    <div className="overlay">
      {tour.phase === "intro" && <Intro onStart={p.onStart} />}

      {tour.phase === "flyover" && (
        <div className="names" aria-live="polite">
          <span>{story.herName}</span>
          <span className="names-heart">♥</span>
          <span>{story.hisName}</span>
        </div>
      )}

      {inWorld && (
        <div className="hud-top">
          <div className="pill" data-testid="counter">
            {found >= total ? "You found them all ♥" : `${found} of ${total} memories`}
          </div>
          <div className="hud-right">
            <button
              className={`icon-btn ${p.music ? "on" : ""}`}
              onClick={p.onToggleMusic}
              aria-label={p.music ? "Mute music" : "Play music"}
            >
              <span className="bars" aria-hidden>
                <i />
                <i />
                <i />
              </span>
            </button>
            <button className="pill pill-btn" onClick={() => setMenu(true)} data-testid="menu">
              Menu
            </button>
          </div>
        </div>
      )}

      {tour.phase === "tour" && (tour.stopPhase === "ready" || tour.stopPhase === "travel") && (
        <div className={`action-wrap ${tour.stopPhase === "ready" ? "show" : ""}`}>
          {memory.actionType === "hold" ? (
            <HoldButton label={memory.action} onDone={p.onAct} />
          ) : (
            <button className="action-btn" onClick={p.onAct} data-testid="action">
              {memory.action}
            </button>
          )}
        </div>
      )}

      {tour.phase === "tour" && tour.stopPhase !== "card" && (
        <div className="controls">
          <button className="ctl ghost" onClick={p.onBack} disabled={tour.stopIndex === 0}>
            Back
          </button>
          <div className="dots" aria-hidden>
            {story.memories.map((m, i) => (
              <i key={m.id} className={`${i === tour.stopIndex ? "cur" : ""} ${tour.acted[m.id] != null ? "done" : ""}`} />
            ))}
          </div>
          <button className={`ctl dark ${p.auto ? "on" : ""}`} onClick={p.onToggleAuto} aria-pressed={p.auto}>
            Auto
          </button>
          <button className="ctl pink" onClick={p.onNext} data-testid="next">
            Next
          </button>
        </div>
      )}

      {tour.phase === "tour" && tour.stopPhase === "card" && (
        <div className="sheet-backdrop">
          <article className="card" data-testid="card">
            <div className={`card-art ${photo ? "has-photo" : ""}`}>
              {photo ? (
                <figure className="polaroid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" />
                </figure>
              ) : (
                <Illustration id={memory.id} />
              )}
            </div>
            <div className="card-body">
              <p className="kicker">{memory.kicker}</p>
              <h2 className="script">{memory.title}</h2>
              <p className="card-text">{memory.text}</p>
              <button className="wide-btn" onClick={p.onNext} data-testid="card-next" autoFocus>
                {tour.stopIndex === total - 1 ? "Continue" : "Next memory"}
              </button>
            </div>
          </article>
        </div>
      )}

      {tour.phase === "letter" && (
        <div className="sheet-backdrop letter-backdrop">
          <article className="letter" data-testid="letter">
            <h2 className="script">{story.letter.greeting}</h2>
            {story.letter.paragraphs.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
            <p className="sign">{story.letter.signOff}</p>
            <p className="script signature">{story.hisName}</p>
            <button className="wide-btn" onClick={p.onAfterLetter} data-testid="letter-continue">
              Continue
            </button>
          </article>
        </div>
      )}

      {tour.phase === "gallery" && <Gallery onDone={p.onFinale} />}

      {tour.phase === "finale" && (
        <div className="finale">
          <p className="glow-text">{story.finaleLine}</p>
          <div className="finale-actions">
            <button className="ctl ghost" onClick={p.onLetter}>
              Read the letter
            </button>
            <button className="ctl pink" onClick={p.onReplay} data-testid="replay">
              Walk through again
            </button>
          </div>
        </div>
      )}

      {menu && (
        <div className="sheet-backdrop" onClick={() => setMenu(false)}>
          <nav className="menu" onClick={(e) => e.stopPropagation()} aria-label="Memories">
            <div className="menu-head">
              <h3>The kingdom</h3>
              <button className="icon-close" onClick={() => setMenu(false)} aria-label="Close">
                ×
              </button>
            </div>
            <ol>
              {story.memories.map((m, i) => (
                <li key={m.id}>
                  <button
                    onClick={() => {
                      setMenu(false);
                      p.onJump(i);
                    }}
                    className={i === tour.stopIndex && tour.phase === "tour" ? "cur" : ""}
                  >
                    <span className="num">{tour.acted[m.id] != null ? "♥" : i + 1}</span>
                    <span>
                      <b>{m.kicker}</b>
                      <small>{tour.acted[m.id] != null ? m.title : m.action}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <button
              className="wide-btn"
              onClick={() => {
                setMenu(false);
                p.onLetter();
              }}
            >
              Read the letter
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="intro">
      <div className="intro-card">
        <p className="kicker">{story.introKicker}</p>
        <h1 className="script intro-name">{story.herName}</h1>
        <p className="intro-line">{story.introLine}</p>
        <button className="wide-btn" onClick={onStart} data-testid="start">
          Take the royal tour
        </button>
        <p className="hint">Sound on for the full experience ♪</p>
      </div>
    </div>
  );
}

function HoldButton({ label, onDone }: { label: string; onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const done = useRef(false);

  const stop = () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (!done.current) setProgress(0);
  };
  const begin = () => {
    done.current = false;
    start.current = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - start.current) / 1200);
      setProgress(k);
      if (k >= 1) {
        done.current = true;
        raf.current = null;
        onDone();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      className="action-btn hold"
      style={{ ["--p" as string]: progress }}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onDone();
      }}
      data-testid="action"
    >
      <span className="ring" aria-hidden />
      {label}
    </button>
  );
}

function Gallery({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="gallery" data-testid="gallery">
      <h2 className="script gallery-title">{story.photos.galleryTitle}</h2>
      <div className="gallery-grid">
        {story.photos.files.map((src, i) => (
          <button
            key={src}
            className="polaroid gallery-item"
            style={{ ["--r" as string]: `${(i % 2 ? 1 : -1) * (1.5 + (i % 3))}deg`, animationDelay: `${0.15 + i * 0.12}s` }}
            onClick={() => setOpen(src)}
            aria-label={`Open photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <div className="gallery-actions">
        <button className="wide-btn" onClick={onDone} data-testid="gallery-continue">
          Continue
        </button>
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="" />
        </div>
      )}
    </div>
  );
}
