export default function Home() {
  return (
    <>
      <header className="masthead">
        <div className="page-width flex items-center justify-between gap-4">
          <div className="wordmark">
            <span className="brand-mark" aria-hidden="true" />
            FrameFlow
          </div>
          <a className="repo-link" href="https://github.com/jiaqigeng/FrameFlow">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main className="page-width">
        <div className="introduction">
          <div>
            <p className="category">Engineering walkthrough</p>
            <h1 id="clip-title">Release recovery</h1>
          </div>
          <p className="synopsis" id="clip-description">
            A simulated checkout release sends errors to 8%. Watch the team
            pause the rollout and restore the previous version.
          </p>
        </div>

        <figure>
          <video
            aria-labelledby="clip-title"
            aria-describedby="clip-description"
            className="player"
            controls
            playsInline
            preload="metadata"
            poster="/media/release-recovery.jpg"
          >
            <source src="/media/release-recovery.mp4" type="video/mp4" />
            <track
              kind="captions"
              src="/media/release-recovery.vtt"
              srcLang="en"
              label="English"
              default
            />
            <a href="/media/release-recovery.mp4">Download the sample video</a>
          </video>
          <figcaption className="clip-details">
            <span>FrameFlow original sample</span>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="cc-mark">CC</span>
              English captions
            </span>
          </figcaption>
        </figure>
      </main>
    </>
  );
}
