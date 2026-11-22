export type JobStatus = "queued" | "processing" | "ready" | "failed";

export interface VideoJob {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: number;
  status: JobStatus;
  duration?: number;
  thumbnail?: string;
  error?: string;
}

interface StoredJob extends VideoJob {
  attempt?: string;
  claimedAt?: number;
}

const queueName = "frameflow-local-videos";
const decodeTimeout = 30_000;
let connection: Promise<IDBDatabase> | undefined;
let channel: BroadcastChannel | null | undefined;
const listeners = new Set<() => void>();

function database() {
  if (!connection) {
    connection = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("Allow site storage in this browser to save local videos."));
        return;
      }
      const request = indexedDB.open(queueName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("jobs", { keyPath: "id" });
        request.result.createObjectStore("files");
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          connection = undefined;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    }).catch((error) => {
      connection = undefined;
      if (error instanceof DOMException && error.name === "SecurityError") {
        throw new Error("Allow site storage in this browser to save local videos.");
      }
      throw error;
    });
  }
  return connection;
}

// Resolve only after all reads and writes in the transaction have committed.
async function transaction<T>(
  stores: string[],
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction, result: (value: T) => void) => void,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    let value: T;
    tx.oncomplete = () => resolve(value);
    tx.onabort = () => reject(tx.error ?? new Error("Browser storage is unavailable."));
    try {
      run(tx, (result) => { value = result; });
    } catch (error) {
      tx.abort();
      reject(error);
    }
  });
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function updatesChannel() {
  if (channel === undefined) {
    try {
      channel = new BroadcastChannel(queueName);
      channel.onmessage = notifyListeners;
    } catch {
      channel = null;
    }
  }
  return channel;
}

function announceChange() {
  if (updatesChannel()) {
    channel?.postMessage("jobs-changed");
  } else {
    try {
      localStorage.setItem(queueName, Math.random().toString());
    } catch {
      // Storage notifications are optional; the IndexedDB transaction already committed.
    }
  }
  notifyListeners();
}

export function subscribeJobs(listener: () => void): () => void {
  function onStorage(event: StorageEvent) {
    if (event.key === queueName) listener();
  }
  if (!updatesChannel()) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    listeners.delete(listener);
  };
}

function createId(): string {
  const random = globalThis.crypto;
  if (random?.randomUUID) return random.randomUUID();
  if (!random?.getRandomValues) throw new Error("Open FrameFlow over HTTPS or localhost to import videos.");
  return Array.from(random.getRandomValues(new Uint8Array(16)), (n) => n.toString(16).padStart(2, "0")).join("");
}

export function listJobs(): Promise<VideoJob[]> {
  return transaction(["jobs"], "readonly", (tx, result) => {
    const request = tx.objectStore("jobs").getAll();
    request.onsuccess = () => {
      const jobs: VideoJob[] = request.result;
      result(jobs.sort((a, b) => b.createdAt - a.createdAt));
    };
  });
}

export function getVideoFile(id: string): Promise<Blob | undefined> {
  return transaction(["files"], "readonly", (tx, result) => {
    const request = tx.objectStore("files").get(id);
    request.onsuccess = () => result(request.result);
  });
}

export async function enqueueFiles(files: File[]): Promise<void> {
  for (const file of files) {
    const job: VideoJob = {
      id: createId(),
      name: file.name,
      size: file.size,
      type: file.type,
      createdAt: Date.now(),
      status: "queued",
    };
    try {
      await transaction(["jobs", "files"], "readwrite", (tx) => {
        tx.objectStore("files").add(file, job.id);
        tx.objectStore("jobs").add(job);
      });
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") throw error;
      job.status = "failed";
      job.error = "Browser storage is full. Free up space and select this file again.";
      await transaction(["jobs"], "readwrite", (tx) => { tx.objectStore("jobs").add(job); });
    }
    announceChange();
  }
}

export async function retryJob(id: string): Promise<void> {
  await transaction(["jobs"], "readwrite", (tx) => {
    const store = tx.objectStore("jobs");
    const request = store.get(id);
    request.onsuccess = () => {
      const job: StoredJob | undefined = request.result;
      if (job?.status === "failed") {
        delete job.error;
        store.put({ ...job, status: "queued" });
      }
    };
  });
  announceChange();
}

export async function removeJob(id: string): Promise<void> {
  await transaction(["jobs", "files"], "readwrite", (tx) => {
    tx.objectStore("jobs").delete(id);
    tx.objectStore("files").delete(id);
  });
  announceChange();
}

function inspectVideo(file: Blob): Promise<{ duration: number; thumbnail: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const timer = window.setTimeout(() => {
      cleanUp();
      reject(new Error("Reading the video timed out. Retry or choose a different encoding."));
    }, decodeTimeout);

    function cleanUp() {
      window.clearTimeout(timer);
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    }

    function capture() {
      if (video.seeking || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("The browser could not create a thumbnail. Try again.");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve({ duration: video.duration, thumbnail: canvas.toDataURL("image/jpeg", 0.78) });
      } catch (error) {
        reject(error);
      } finally {
        cleanUp();
      }
    }

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => {
      cleanUp();
      reject(new Error("The browser could not decode this video. Try a playable MP4 or WebM file."));
    };
    video.onloadedmetadata = () => {
      if (!video.videoWidth || !Number.isFinite(video.duration) || video.duration <= 0) {
        cleanUp();
        reject(new Error("A video track with a readable duration is required."));
        return;
      }
      video.currentTime = Math.min(1, video.duration / 2);
    };
    video.onloadeddata = capture;
    video.onseeked = capture;
    video.src = url;
  });
}

// Web Locks release on tab close, so their next holder can reclaim interrupted jobs
// immediately. The time limit serves the same purpose where locks are unavailable.
type Claim = { job?: StoredJob; retryAfter?: number };

async function claimNext(exclusive: boolean): Promise<Claim> {
  return transaction(["jobs"], "readwrite", (tx, result) => {
    const store = tx.objectStore("jobs");
    const request = store.getAll();
    request.onsuccess = () => {
      const jobs: StoredJob[] = request.result;
      const now = Date.now();
      const pending = jobs.sort((a, b) => a.createdAt - b.createdAt).find((job) =>
        job.status === "queued" || (job.status === "processing" &&
          (exclusive || now - (job.claimedAt ?? 0) >= decodeTimeout * 2)),
      );
      if (pending) {
        pending.status = "processing";
        pending.attempt = createId();
        pending.claimedAt = now;
        store.put(pending);
        result({ job: pending });
      } else {
        const deadlines = jobs.filter((job) => job.status === "processing")
          .map((job) => (job.claimedAt ?? 0) + decodeTimeout * 2);
        result(deadlines.length ? { retryAfter: Math.max(0, Math.min(...deadlines) - now) } : {});
      }
    };
  });
}

// Another tab can finish or close while we wait. Wake on either its update or
// the expiry of its claim, including on browsers without BroadcastChannel.
function waitForChange(delay: number): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = subscribeJobs(wake);
    const timer = window.setTimeout(wake, delay);
    function wake() {
      window.clearTimeout(timer);
      unsubscribe();
      resolve();
    }
  });
}

async function drainQueue(exclusive: boolean, onChange?: () => void) {
  while (true) {
    const { job, retryAfter } = await claimNext(exclusive);
    if (!job) {
      if (retryAfter === undefined) return;
      await waitForChange(retryAfter);
      continue;
    }
    announceChange();
    onChange?.();
    const { id, attempt } = job;
    let outcome: Partial<VideoJob>;
    try {
      const file = await getVideoFile(id);
      if (!file) throw new Error("The source file is missing. Select this video again.");
      outcome = { status: "ready", ...(await inspectVideo(file)) };
    } catch (error) {
      outcome = { status: "failed", error: error instanceof Error ? error.message : "Could not read this video." };
    }
    await transaction(["jobs"], "readwrite", (tx) => {
      const store = tx.objectStore("jobs");
      const request = store.get(id);
      request.onsuccess = () => {
        const current: StoredJob | undefined = request.result;
        if (current && current.attempt === attempt) {
          delete current.attempt;
          delete current.claimedAt;
          store.put({ ...current, ...outcome });
        }
      };
    });
    announceChange();
    onChange?.();
  }
}

export async function processQueue(onChange?: () => void): Promise<void> {
  if (navigator.locks) {
    await navigator.locks.request(queueName, () => drainQueue(true, onChange));
  } else {
    await drainQueue(false, onChange);
  }
}
