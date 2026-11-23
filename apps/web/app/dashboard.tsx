"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { films, timestamp } from "./catalog";
import { enqueueFiles, listJobs, processQueue, removeJob, retryJob, subscribeJobs, type VideoJob } from "./local-videos";
import "./dashboard.css";

const sample = films.find((film) => film.slug === "llamigos");

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

function readableError(cause: unknown) {
  if (cause instanceof DOMException && cause.name === "QuotaExceededError") {
    return "Browser storage is full. Free up space or try a smaller video.";
  }
  if (cause instanceof Error && cause.message) return cause.message;
  return "FrameFlow couldn’t access browser storage. Allow site storage and try again.";
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5V3.75m-4.2 4.2L12 3.75l4.2 4.2M4 15.5v3.25a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V15.5" />
    </svg>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<"files" | "sample" | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  const refreshNumber = useRef(0);

  const reportError = useCallback((cause: unknown) => {
    if (mounted.current) setError(readableError(cause));
  }, []);

  const refresh = useCallback(async () => {
    const sequence = ++refreshNumber.current;
    try {
      const latest = await listJobs();
      if (mounted.current && sequence === refreshNumber.current) setJobs(latest);
    } catch (cause) {
      reportError(cause);
    } finally {
      if (mounted.current && sequence === refreshNumber.current) setLoading(false);
    }
  }, [reportError]);

  const runQueue = useCallback(() => {
    void processQueue().catch(reportError);
  }, [reportError]);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = subscribeJobs(refresh);
    void refresh();
    runQueue();
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [refresh, runQueue]);

  async function addVideos(selection: File[] | "sample") {
    if (adding || (selection !== "sample" && !selection.length)) return;
    setAdding(selection === "sample" ? "sample" : "files");
    setError("");
    try {
      let files: File[];
      if (selection === "sample") {
        if (!sample) throw new Error("The sample is unavailable.");
        const response = await fetch(sample.source);
        if (!response.ok) throw new Error("The sample video couldn’t be loaded. Try again.");
        files = [new File([await response.blob()], `${sample.title}.mp4`, { type: "video/mp4" })];
      } else {
        files = selection;
      }
      await enqueueFiles(files);
    } catch (cause) {
      reportError(cause);
    } finally {
      await refresh();
      runQueue();
      if (mounted.current) setAdding(null);
    }
  }

  async function retry(id: string) {
    setError("");
    try {
      await retryJob(id);
      await refresh();
      runQueue();
    } catch (cause) {
      reportError(cause);
    }
  }

  async function remove(job: VideoJob) {
    if (!window.confirm(`Remove “${job.name}” from this browser’s queue and library?`)) return;
    setError("");
    try {
      await removeJob(job.id);
      await refresh();
    } catch (cause) {
      reportError(cause);
    }
  }

  function dropVideos(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void addVideos(Array.from(event.dataTransfer.files));
  }

  return (
    <main className="page-width dashboard">
      <header className="dashboard-heading">
        <h1>Processing dashboard</h1>
        <p>Extract thumbnails and durations from your videos.</p>
      </header>

      <div className="dashboard-intake">
        {sample && (
          <article className="dashboard-sample">
            <img className="sample-still" src={sample.poster} alt="" width="1280" height="720" />
            <div className="sample-content">
              <p className="sample-category">Sample video</p>
              <h2><Link href={`/watch/${sample.slug}`}>{sample.title}</Link></h2>
              <p className="sample-meta">{sample.series} · {timestamp(sample.duration)}</p>
              <button className="sample-process" type="button" disabled={!!adding} onClick={() => void addVideos("sample")}>
                {adding === "sample" ? "Adding sample…" : "Process sample"} <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        )}
        <div
          className={`upload-target${dragging ? " is-dragging" : ""}`}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes("Files")) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false);
          }}
          onDrop={dropVideos}
        >
          <span className="upload-icon"><UploadIcon /></span>
          <h2>{dragging ? "Drop to add to the queue" : "Drop videos here"}</h2>
          <p>Add one or more files at a time.</p>
          <input
            type="file" ref={picker} accept="video/*" multiple hidden
            aria-label="Choose video files"
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = "";
              void addVideos(files);
            }}
          />
          <button type="button" className="choose-videos" disabled={!!adding} onClick={() => picker.current?.click()}>
            {adding === "files" ? "Adding videos…" : "Choose videos"}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="dashboard-error">{error}</p>}

      <section id="processing-queue" className="dashboard-queue" aria-labelledby="queue-title">
        <header className="queue-header">
          <h2 id="queue-title">Processing queue</h2>
          <Link href="/library">View library <span aria-hidden="true">→</span></Link>
        </header>
        <div className="queue-surface">
          <table className="queue-table" aria-labelledby="queue-title">
            <thead>
              <tr>
                <th scope="col">File name</th>
                <th scope="col">Status</th>
                <th scope="col" className="job-size">Size</th>
                <th scope="col" className="actions-heading">Actions</th>
              </tr>
            </thead>
            <tbody aria-live="polite" aria-relevant="additions text">
              {jobs.map((job) => (
                <tr key={job.id} className="job-row">
                  <th scope="row">
                    <div className="job-ident">
                      <div className="job-poster">{job.thumbnail ? <img src={job.thumbnail} alt="" /> : <span aria-hidden="true">▶</span>}</div>
                      <div className="job-info">
                        <span className="job-name">{job.name}</span>
                        <span className="job-meta">
                          {job.duration !== undefined && <span>{timestamp(Math.round(job.duration))}</span>}
                          <span className="mobile-size">{fileSize(job.size)}</span>
                        </span>
                        {job.status === "failed" && <span className="job-error">{job.error || "This video couldn’t be processed."}</span>}
                      </div>
                    </div>
                  </th>
                  <td><span className={`job-status status-${job.status}`}>{job.status}</span></td>
                  <td className="job-size">{fileSize(job.size)}</td>
                  <td>
                    <div className="job-action">
                      {job.status === "ready" && <Link href={`/watch/local/${job.id}`} aria-label={`Watch ${job.name}`}>Watch</Link>}
                      {job.status === "failed" && <button type="button" aria-label={`Retry ${job.name}`} onClick={() => void retry(job.id)}>Retry</button>}
                      {(job.status === "ready" || job.status === "failed") && (
                        <button type="button" className="job-remove" aria-label={`Remove ${job.name}`} onClick={() => void remove(job)}>Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <div className="queue-empty" role="status">
              <span className="empty-glyph" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="M7.5 4.5v15m9-15v15M3 9h4.5M3 15h4.5m9-6H21m-4.5 6H21" />
                </svg>
              </span>
              <h3>{loading ? "Opening your queue…" : "No videos in the queue"}</h3>
              {!loading && <p>Choose a file or process the sample to get started.</p>}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
