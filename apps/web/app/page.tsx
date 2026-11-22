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
            <p className="category">Caminandes · Film excerpt</p>
            <h1 id="clip-title">Llamigos</h1>
          </div>
          <p className="synopsis" id="clip-description">
            It’s winter in Patagonia. Koro the llama and Oti the penguin both
            have their eye on the same berry.
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
            poster="/media/llamigos.jpg"
          >
            <source src="/media/llamigos.mp4" type="video/mp4" />
            <a href="/media/llamigos.mp4">Download the Llamigos excerpt</a>
          </video>
          <figcaption className="clip-details">
            <a
              className="underline underline-offset-4"
              href="https://www.youtube.com/watch?v=SkVqJ1SGeL0"
            >
              Original film by Blender Foundation
            </a>
            <a
              className="underline underline-offset-4"
              href="https://creativecommons.org/licenses/by/3.0/"
            >
              Creative Commons Attribution 3.0
            </a>
          </figcaption>
        </figure>
      </main>
    </>
  );
}
