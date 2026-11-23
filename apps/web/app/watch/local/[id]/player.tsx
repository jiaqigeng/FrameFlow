"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getVideoFile, listJobs, type VideoJob } from "../../../local-videos";
import { timestamp } from "../../../catalog";

export function LocalPlayer({ id }: { id: string }) {
  const [video, setVideo] = useState<{ job: VideoJob; url: string }>();
  const [message, setMessage] = useState("Loading video…");

  useEffect(() => {
    let active = true;
    let url: string | undefined;
    async function load() {
      try {
        const [jobs, file] = await Promise.all([listJobs(), getVideoFile(id)]);
        if (!active) return;
        const job = jobs.find((item) => item.id === id);
        if (!job || !file || job.status !== "ready") {
          setMessage("This video is unavailable here. Open the dashboard on the browser where you added it.");
          return;
        }
        url = URL.createObjectURL(file);
        setVideo({ job, url });
      } catch {
        if (active) setMessage("This browser couldn’t open the stored video.");
      }
    }
    void load();
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  return (
    <main className="page-width watch-page">
      <Link className="back-link" href="/library"><span aria-hidden="true">←</span> Back to library</Link>
      {video ? (
        <>
          <header className="watch-heading">
            <p className="eyebrow">Your video{video.job.duration !== undefined && ` · ${timestamp(Math.round(video.job.duration))}`}</p>
            <h1 id="local-title">{video.job.name}</h1>
          </header>
          <video controls playsInline preload="metadata" className="player" aria-labelledby="local-title" poster={video.job.thumbnail} src={video.url} />
        </>
      ) : <p className="load-message" role="status">{message}</p>}
    </main>
  );
}
