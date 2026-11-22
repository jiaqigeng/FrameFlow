"use client";

import Form from "next/form";
import { useLayoutEffect, useRef, useState } from "react";
import { films, timestamp } from "./catalog";
import "./opening-sequence.css";

const sample = films.find((film) => film.slug === "llamigos");
const introKey = "frameflow.sign-in.intro-seen";

function Brand({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? "opening-wordmark" : "sign-in-wordmark"}>
      <span className="brand-mark" aria-hidden="true"><span className="play-symbol" /></span>
      FrameFlow
    </div>
  );
}

export function SignInPage() {
  const [phase, setPhase] = useState<"preparing" | "playing" | "ready">("preparing");
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
        <Brand />
        <h1 id="sign-in-title">Sign in</h1>
        <p id="demo-access">Select Sign in to explore the demo. Both fields are optional.</p>
        {/* Unnamed inputs are excluded from both native and client-side navigation. */}
        <label htmlFor="demo-email">Email</label>
        <input id="demo-email" type="email" placeholder="demo@example.com" />
        <label htmlFor="demo-password">Password</label>
        <input id="demo-password" type="password" placeholder="••••••••••" />
        <button type="submit">Sign in</button>
      </Form>
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
            <Brand large />
          </div>
          <button type="button" className="opening-skip" onClick={() => setPhase("ready")}>
            Skip intro <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </main>
  );
}
