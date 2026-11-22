"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { enqueueFiles, processQueue } from "./local-videos";
import { WorkspaceIcon } from "./workspace-icon";
import { WorkspaceSearch } from "./workspace-search";
import "./workspace.css";

const queueDestination = "/dashboard#processing-queue";

function Wordmark({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/dashboard" className="workspace-wordmark" aria-label="FrameFlow dashboard" onNavigate={onNavigate}>
      <span className="brand-mark" aria-hidden="true"><span className="play-symbol" /></span>
      FrameFlow
    </Link>
  );
}

function Workspace({ children, path }: { children: ReactNode; path: string }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hash, setHash] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);
    drawer.current?.close();
    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, [path]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    const closeOnDesktop = () => { if (desktop.matches) drawer.current?.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function chooseFiles() {
    drawer.current?.close();
    picker.current?.click();
  }

  async function addFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      await enqueueFiles(files);
      setHash("#processing-queue");
      router.push(queueDestination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The selected videos couldn’t be added.");
    } finally {
      setUploading(false);
      // A multi-file selection can contain jobs that were saved before a later file failed.
      void processQueue().catch(() => setError("The processing queue couldn’t be opened. Try the dashboard again."));
    }
  }

  const inQueue = path === "/dashboard" && hash === "#processing-queue";
  function navigationItems() {
    return (
      <>
        <button className="workspace-add" type="button" onClick={chooseFiles} disabled={uploading}>
          <WorkspaceIcon name="plus" />{uploading ? "Adding videos…" : "Add videos"}
        </button>
        <nav className="workspace-nav" aria-label="Main navigation">
          <Link href="/dashboard" aria-current={path === "/dashboard" && !inQueue ? "page" : undefined}
            onNavigate={() => { setHash(""); drawer.current?.close(); }}>
            <WorkspaceIcon name="dashboard" />Dashboard
          </Link>
          <Link href="/library" aria-current={path === "/library" ? "page" : path.startsWith("/watch/") ? "location" : undefined}
            onNavigate={() => { setHash(""); drawer.current?.close(); }}>
            <WorkspaceIcon name="library" />Video library
          </Link>
          <Link href={queueDestination} aria-current={inQueue ? "location" : undefined}
            onNavigate={() => { setHash("#processing-queue"); drawer.current?.close(); }}>
            <WorkspaceIcon name="queue" />Processing queue
          </Link>
        </nav>
        <div className="workspace-device">
          <span className="device-icon"><WorkspaceIcon name="device" /></span>
          <div><strong>Local workspace</strong><span>Stored in this browser</span></div>
        </div>
      </>
    );
  }

  return (
    <div className="workspace">
      <a className="workspace-skip" href="#workspace-content">Skip to content</a>
      <input ref={picker} type="file" accept="video/*" multiple hidden aria-label="Add video files" onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = "";
        void addFiles(files);
      }} />
      <aside className="workspace-sidebar" aria-label="Workspace">
        <div className="sidebar-brand"><Wordmark onNavigate={() => setHash("")} /></div>
        {navigationItems()}
      </aside>
      <dialog className="workspace-drawer" ref={drawer} id="workspace-drawer" aria-label="Workspace navigation"
        onClose={() => setMenuOpen(false)} onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) drawer.current?.close();
        }}>
        <div className="drawer-heading">
          <Wordmark onNavigate={() => { setHash(""); drawer.current?.close(); }} />
          <button className="workspace-icon-button" type="button" aria-label="Close menu" onClick={() => drawer.current?.close()}><WorkspaceIcon name="close" /></button>
        </div>
        {navigationItems()}
      </dialog>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="workspace-mobile-bar">
            <button className="workspace-icon-button" type="button" aria-label="Menu" aria-haspopup="dialog"
              aria-expanded={menuOpen} aria-controls="workspace-drawer" onClick={() => {
                drawer.current?.showModal();
                setMenuOpen(true);
              }}>
              <WorkspaceIcon name="menu" />
            </button>
            <Wordmark onNavigate={() => setHash("")} />
          </div>
          <WorkspaceSearch />
          <a className="workspace-github" href="https://github.com/jiaqigeng/FrameFlow">
            GitHub <WorkspaceIcon name="external" />
          </a>
        </header>
        <noscript>
          <nav className="workspace-basic-nav" aria-label="Workspace navigation">
            <a href="/dashboard">Dashboard</a><a href="/library">Video library</a><a href={queueDestination}>Processing queue</a>
          </nav>
        </noscript>
        {error && <div role="alert" className="workspace-error">{error}<button type="button" onClick={() => setError("")}>Dismiss</button></div>}
        <div className="workspace-content" id="workspace-content" tabIndex={-1}>{children}</div>
      </div>
    </div>
  );
}

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path === "/") return children;
  return <Workspace path={path}>{children}</Workspace>;
}
