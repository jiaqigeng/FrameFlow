"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { films, timestamp } from "../catalog";
import { listJobs, subscribeJobs, type VideoJob } from "../local-videos";
import "./library.css";

type View = "list" | "grid";

interface LibraryItem {
  href: string;
  title: string;
  detail: string;
  source: string;
  image?: string;
  seconds?: number;
}

const viewKey = "frameflow.library.view";

function uploadedVideo(job: VideoJob): LibraryItem {
  const size = job.size < 1024 * 1024
    ? `${Math.ceil(job.size / 1024)} KB`
    : `${(job.size / 1024 / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
  const format = job.type.split("/")[1]?.toUpperCase();
  return {
    href: `/watch/local/${job.id}`,
    title: job.name,
    detail: `${format || "Video"} · ${size}`,
    source: "Browser upload",
    image: job.thumbnail,
    seconds: job.duration,
  };
}

function Collection({ items, title, sourceLabel, timeLabel, view }: {
  items: LibraryItem[];
  title: string;
  sourceLabel: string;
  timeLabel: string;
  view: View;
}) {
  if (!items.length) return null;
  return (
    <section className="file-collection" aria-label={title}>
      <h2>{title}</h2>
      {view === "list" ? (
        <table className="file-table" aria-label={title}>
          <thead><tr><th scope="col">Name</th><th scope="col">{sourceLabel}</th><th scope="col">{timeLabel}</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.href}>
                <td>
                  <Link href={item.href} className="file-row-link" aria-label={item.title}>
                    <span className="file-thumb">{item.image && <img src={item.image} alt="" />}</span>
                    <span className="file-identity"><span className="file-name">{item.title}</span><span className="file-detail">{item.detail}</span></span>
                  </Link>
                </td>
                <td className="file-source">{item.source}</td>
                <td className="file-time">{item.seconds === undefined ? "—" : timestamp(Math.round(item.seconds))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="file-grid">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="file-tile" aria-label={item.title}>
                <div className="file-cover">
                  {item.image && <img src={item.image} alt="" />}
                  {item.seconds !== undefined && <span className="file-stamp">{timestamp(Math.round(item.seconds))}</span>}
                </div>
                <div className="file-card-copy">
                  <p className="file-name">{item.title}</p>
                  <p className="file-detail">{item.source} · {item.detail}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Library() {
  const query = useSearchParams().get("q") ?? "";
  const [view, setView] = useState<View>("list");
  const [uploads, setUploads] = useState<VideoJob[]>([]);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(viewKey) === "grid") setView("grid");
    } catch {
      // The switch also works for this visit if preferences cannot be saved.
    }
    let revision = 0;
    async function refresh() {
      const version = ++revision;
      try {
        const jobs = await listJobs();
        if (version === revision) {
          setUploads(jobs.filter((job) => job.status === "ready"));
          setStorageError(false);
        }
      } catch {
        if (version === revision) setStorageError(true);
      }
    }
    const unsubscribe = subscribeJobs(refresh);
    void refresh();
    return () => {
      revision++;
      unsubscribe();
    };
  }, []);

  function changeView(next: View) {
    setView(next);
    try {
      localStorage.setItem(viewKey, next);
    } catch {
      // Keep the current in-memory preference.
    }
  }

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  function matches(...fields: string[]) {
    const text = fields.join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  }
  const videos: LibraryItem[] = [
    ...uploads.filter((job) => matches(job.name)).map(uploadedVideo),
    ...films.filter((film) => matches(film.title, film.series, film.studio, film.genre, film.synopsis)).map((film) => ({
      href: `/watch/${film.slug}`,
      title: film.title,
      detail: `${film.series} · ${film.genre}`,
      source: "Sample video",
      image: film.poster,
      seconds: film.duration,
    })),
  ];
  const scenes: LibraryItem[] = films.flatMap((film) => film.scenes
    .filter((scene) => matches(film.title, film.series, scene.title, scene.description))
    .map((scene) => ({
      href: `/watch/${film.slug}?t=${scene.seconds}`,
      title: scene.title,
      detail: scene.description,
      source: film.title,
      image: scene.image,
      seconds: scene.seconds,
    })),
  );

  return (
    <main className="page-width file-browser">
      <header className="file-header">
        <div>
          <h1>Video library</h1>
          <p className="file-count" role="status">
            {videos.length} {videos.length === 1 ? "video" : "videos"} · {scenes.length} {scenes.length === 1 ? "scene" : "scenes"}
            {words.length > 0 && <> matching <strong>“{query.trim()}”</strong></>}
          </p>
        </div>
        <div className="file-view-switch" role="group" aria-label="Library view">
          <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => changeView("list")}>
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h1M4 12h1M4 18h1M9 6h11M9 12h11M9 18h11" />
            </svg>
            List
          </button>
          <button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => changeView("grid")}>
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3" y="3" width="7" height="7" rx="1.3" /><rect x="14" y="3" width="7" height="7" rx="1.3" />
              <rect x="3" y="14" width="7" height="7" rx="1.3" /><rect x="14" y="14" width="7" height="7" rx="1.3" />
            </svg>
            Grid
          </button>
        </div>
      </header>
      {storageError && <p className="file-error" role="alert">This browser couldn’t load your local videos.</p>}
      <Collection title="Videos" items={videos} view={view} sourceLabel="Source" timeLabel="Duration" />
      <Collection title={words.length ? "Matching scenes" : "Explore scenes"} items={scenes} view={view} sourceLabel="From video" timeLabel="Starts at" />
      {videos.length === 0 && scenes.length === 0 && (
        <section className="file-empty">
          <h2>No matches</h2>
          <p>Try a video name or a scene detail, like “mine cart”.</p>
          <Link href="/library">Clear search</Link>
        </section>
      )}
    </main>
  );
}
