"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
  const path = usePathname();
  return (
    <nav className="page-width nav-bar" aria-label="Main navigation">
      <Link href="/" className="wordmark" aria-label="FrameFlow home">
        <span className="brand-mark" aria-hidden="true"><span className="play-symbol" /></span>
        FrameFlow
      </Link>
      <Link href="/" className="nav-item" aria-current={path === "/" ? "page" : undefined}>Dashboard</Link>
      <Link href="/library" className="nav-item" aria-current={path === "/library" ? "page" : path.startsWith("/watch/") ? "location" : undefined}>Library</Link>
      <a className="repo-link" href="https://github.com/jiaqigeng/FrameFlow">GitHub <span aria-hidden="true">↗</span></a>
    </nav>
  );
}
