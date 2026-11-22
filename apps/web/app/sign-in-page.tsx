"use client";

import Form from "next/form";
import { useLayoutEffect, useRef, useState } from "react";
import { films, timestamp } from "./catalog";
import "./opening-sequence.css";

const sample = films.find((film) => film.slug === "llamigos");
const introKey = "frameflow.sign-in.intro-seen";

export function SignInPage() {
  const [phase, setPhase] = useState<"preparing" | "playing" | "ready">("preparing");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const curtainRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (phase === "ready") return;
    let active = true;
    function finish() {
      if (active) setPhase("ready");
      active = false;
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!sample || motion.matches) {
      finish();
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
    }
    document.addEventListener("keydown", handleKey);
    motion.addEventListener("change", finish);

    const startedInBackground = document.visibilityState !== "visible";
    let timeout: number | undefined;
    const curtain = curtainRef.current;
    function prepare() {
      if (document.visibilityState !== "visible" || !curtain) return;
      document.removeEventListener("visibilitychange", prepare);
      try {
        if (sessionStorage.getItem(introKey) || document.activeElement?.closest(".sign-in-form")) {
          finish();
          return;
        }
      } catch {
        finish();
        return;
      }
      // If hydration arrived late, the CSS fallback has already revealed the form.
      if (!startedInBackground && getComputedStyle(curtain).visibility === "hidden") {
        finish();
        return;
      }
      timeout = window.setTimeout(finish, 450);
      const images = Array.from(curtain.querySelectorAll("img"), (image) => image.decode());
      void Promise.all(images).then(() => {
        if (!active) return;
        if (document.visibilityState !== "visible" || motion.matches) return finish();
        try {
          sessionStorage.setItem(introKey, "1");
          setPhase("playing");
        } catch {
          finish();
        }
      }, () => { if (active) finish(); });
    }

    if (phase === "preparing") {
      document.addEventListener("visibilitychange", prepare);
      prepare();
    } else {
      // Also reveal the form when a browser extension disables CSS animation.
      timeout = window.setTimeout(finish, 2300);
    }
    return () => {
      active = false;
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", prepare);
      document.removeEventListener("keydown", handleKey);
      motion.removeEventListener("change", finish);
    };
  }, [phase]);

  return (
    <main className="sign-in-page" data-phase={phase}>
      <div className="entry-panel">
        <div className="entry-wordmark">
          <span className="brand-mark" aria-hidden="true"><span className="play-symbol" /></span>
          FrameFlow
        </div>
        <Form
          action="/dashboard"
          noValidate
          autoComplete="off"
          aria-labelledby="sign-in-title"
          aria-describedby="demo-access"
          className="sign-in-form"
          inert={phase === "playing"}
          onAnimationEnd={(event) => {
            if (event.animationName === "sign-in-arrive") setPhase("ready");
          }}
        >
          <h1 id="sign-in-title">Sign in</h1>
          <p id="demo-access">Leave both fields blank to explore the demo.</p>
          {/* Unnamed inputs are excluded from both native and client-side navigation. */}
          <div className="entry-field">
            <label htmlFor="demo-email">Email</label>
            <input id="demo-email" type="email" placeholder="you@example.com" autoCapitalize="none" spellCheck={false} />
          </div>
          <div className="entry-field">
            <label htmlFor="demo-password">Password</label>
            <div className="entry-password">
              <input id="demo-password" type={passwordVisible ? "text" : "password"} />
              <button
                className="password-toggle"
                type="button"
                aria-controls="demo-password"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button className="entry-submit" type="submit">
            Sign in <span className="entry-arrow" aria-hidden="true">→</span>
          </button>
        </Form>
      </div>
      {phase !== "ready" && sample && (
        <div className="opening-sequence" ref={curtainRef}>
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
          </div>
          <button type="button" className="opening-skip" onClick={() => setPhase("ready")}>
            Skip intro <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </main>
  );
}
