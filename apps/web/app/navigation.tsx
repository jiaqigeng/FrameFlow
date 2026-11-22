"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const path = usePathname();
  if (path === "/") return null;

  return (
    <header className="masthead">
      <nav className="page-width nav-bar" aria-label="Main navigation">
        <Link href="/dashboard" className="wordmark" aria-label="FrameFlow dashboard">
          <span className="brand-mark" aria-hidden="true"><span className="play-symbol" /></span>
          FrameFlow
        </Link>
        <Link href="/dashboard" className="nav-item" aria-current={path === "/dashboard" ? "page" : undefined}>Dashboard</Link>
        <Link href="/library" className="nav-item" aria-current={path === "/library" ? "page" : path.startsWith("/watch/") ? "location" : undefined}>Library</Link>
        <a className="repo-link" href="https://github.com/jiaqigeng/FrameFlow">GitHub <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
  );
}
