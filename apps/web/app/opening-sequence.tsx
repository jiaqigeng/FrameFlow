"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { films, timestamp } from "./catalog";
import "./opening-sequence.css";

const sessionKey = "frameflow.intro.seen";
const sample = films.find((film) => film.slug === "llamigos");

export function OpeningSequence() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [prepareFrames, setPrepareFrames] = useState(false);

  useLayoutEffect(() => {
    if (!sample || !dialogRef.current?.showModal) return;
    function prepareOnFirstView() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", prepareOnFirstView);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.scrollY || (document.activeElement && document.activeElement !== document.body)) return;
      try {
        if (!sessionStorage.getItem(sessionKey)) setPrepareFrames(true);
      } catch {
        // Open directly on the page if the browser doesn't allow session storage.
      }
    }
    document.addEventListener("visibilitychange", prepareOnFirstView);
    prepareOnFirstView();
    return () => document.removeEventListener("visibilitychange", prepareOnFirstView);
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !prepareFrames) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = true;
    function finish() {
      if (active) setPrepareFrames(false);
      active = false;
    }

    // The requested page stays interactive while the stills decode. A slow
    // connection or early interaction gives the visitor the page immediately.
    const preparing = new AbortController();
    for (const event of ["pointerdown", "keydown", "scroll"]) {
      document.addEventListener(event, finish, { signal: preparing.signal, capture: true, passive: true });
    }
    motion.addEventListener("change", finish);
    let timeout = window.setTimeout(finish, 450);
    const frames = Array.from(dialog.querySelectorAll("img"), (image) => image.decode());
    void Promise.all(frames).then(() => {
      if (!active) return;
      preparing.abort();
      if (document.visibilityState !== "visible" || motion.matches) return finish();
      try {
        sessionStorage.setItem(sessionKey, "1");
        dialog.showModal();
      } catch {
        return finish();
      }
      window.clearTimeout(timeout);
      // Release the page even when CSS animations are disabled by an extension.
      timeout = window.setTimeout(finish, 2200);
    }, finish);

    return () => {
      active = false;
      preparing.abort();
      window.clearTimeout(timeout);
      motion.removeEventListener("change", finish);
      if (dialog.open) dialog.close();
    };
  }, [prepareFrames]);

  return (
    <dialog
      ref={dialogRef}
      className="opening-sequence"
      aria-label="FrameFlow intro"
      onCancel={() => setPrepareFrames(false)}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setPrepareFrames(false);
      }}
    >
      {prepareFrames && sample && (
        <>
          <div className="opening-stage" aria-hidden="true">
            <div className="opening-strip">
              {sample.scenes.slice(0, 3).map((scene) => (
                <div className="opening-frame" key={scene.seconds}>
                  <img src={scene.image} alt="" width="640" height="360" />
                  <span>{timestamp(scene.seconds)}</span>
                </div>
              ))}
              <div className="opening-playhead" />
            </div>
            <div className="opening-wordmark">
              <span className="brand-mark"><span className="play-symbol" /></span>
              FrameFlow
            </div>
          </div>
          <button type="button" className="opening-skip" onClick={() => setPrepareFrames(false)}>
            Skip intro <span aria-hidden="true">→</span>
          </button>
        </>
      )}
    </dialog>
  );
}
