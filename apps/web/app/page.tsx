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
            <p className="category">Apollo 11 · July 1969</p>
            <h1 id="clip-title">First step on the Moon</h1>
          </div>
          <p className="synopsis" id="clip-description">
            Listen to Neil Armstrong describe the powdery surface, then watch him
            step off the lunar module onto the Moon.
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
            poster="/media/apollo-11-first-step.jpg"
          >
            <source src="/media/apollo-11-first-step.mp4" type="video/mp4" />
            <track
              kind="captions"
              src="/media/apollo-11-first-step.vtt"
              srcLang="en"
              label="English"
              default
            />
            <a href="/media/apollo-11-first-step.mp4">Download the Apollo 11 clip</a>
          </video>
          <figcaption className="clip-details">
            <a
              className="underline underline-offset-4"
              href="https://commons.wikimedia.org/wiki/File:Apollo_11_Landing_-_first_steps_on_the_moon.ogv"
            >
              NASA footage via Wikimedia Commons
            </a>
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
