"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { films, timestamp } from "../catalog";
import { listJobs, subscribeJobs, type VideoJob } from "../local-videos";
import { SceneCard } from "../scene-card";

export default function Library() {
  const [query, setQuery] = useState("");
  const [uploads, setUploads] = useState<VideoJob[]>([]);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const jobs = await listJobs();
        if (active) {
          setUploads(jobs.filter((job) => job.status === "ready"));
          setStorageError(false);
        }
      } catch {
        if (active) setStorageError(true);
      }
    }
    const unsubscribe = subscribeJobs(refresh);
    void refresh();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (fields: string[]) => {
    const text = fields.join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  };

  const videos = films.filter((film) =>
    matches([film.title, film.series, film.studio, film.genre, film.synopsis]),
  );
  const scenes = films.flatMap((film) =>
    film.scenes
      .filter((scene) => matches([film.title, film.series, scene.title, scene.description]))
      .map((scene) => ({ film, scene })),
  );
  const localMatches = uploads.filter((job) => matches([job.name]));
  const videoCount = localMatches.length + videos.length;

  return (
    <main className="page-width library">
      <div className="library-heading">
        <div>
          <h1>Video library</h1>
          <p className="result-count" role="status">
            {videoCount} {videoCount === 1 ? "video" : "videos"} · {scenes.length} {scenes.length === 1 ? "scene" : "scenes"}
          </p>
        </div>
        <div className="search-box" role="search">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />
          </svg>
          <input type="search" aria-label="Search videos and scenes" placeholder="Search videos and scenes" value={query} onChange={(event) => setQuery(event.target.value)} />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">Clear</button>}
        </div>
      </div>

      {storageError && <p role="alert">This browser couldn’t load your local videos.</p>}
      {localMatches.length > 0 && (
        <section className="uploaded-section" aria-labelledby="uploads-heading">
          <h2 id="uploads-heading">Your videos</h2>
          <div className="scene-grid">
            {localMatches.map((job) => (
              <Link className="scene-card" href={`/watch/local/${job.id}`} key={job.id}>
                <div className="scene-art">
                  {job.thumbnail && <img src={job.thumbnail} width="640" height="360" alt="" />}
                  {job.duration !== undefined && <span className="time-chip">{timestamp(Math.round(job.duration))}</span>}
                </div>
                <p className="scene-title">{job.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      {videos.map((film) => (
        <article className="film-card" key={film.slug}>
          <Link href={`/watch/${film.slug}`} className="film-link">
            <div className="film-art">
              <Image src={film.poster} width={1280} height={720} alt="" preload unoptimized />
              <span className="time-chip">{timestamp(film.duration)}</span>
            </div>
            <div className="film-copy">
              <p className="eyebrow">{film.series} · {film.genre}</p>
              <h2>{film.title}</h2>
              <p className="film-synopsis">{film.synopsis}</p>
              <span className="watch-action"><span className="play-symbol" aria-hidden="true" />Watch excerpt</span>
            </div>
          </Link>
        </article>
      ))}

      {scenes.length > 0 && (
        <section className="scene-section" aria-labelledby="scene-heading">
          <h2 id="scene-heading">{words.length ? "Matching scenes" : "Explore scenes"}</h2>
          <div className="scene-grid">
            {scenes.map(({ film, scene }) => <SceneCard key={`${film.slug}-${scene.seconds}`} film={film} scene={scene} />)}
          </div>
        </section>
      )}
      {videoCount === 0 && scenes.length === 0 && (
        <section className="empty-results">
          <h2>No matches</h2>
          <p>Try a film title or a scene detail, like “mine cart”.</p>
        </section>
      )}
    </main>
  );
}
