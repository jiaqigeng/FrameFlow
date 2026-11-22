import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { films, timestamp } from "../../catalog";
import { SceneCard } from "../../scene-card";

type WatchProps = PageProps<"/watch/[slug]">;

async function getFilm(params: WatchProps["params"]) {
  const { slug } = await params;
  return films.find((film) => film.slug === slug) ?? notFound();
}

export async function generateMetadata({ params }: WatchProps): Promise<Metadata> {
  const film = await getFilm(params);
  return { title: film.title, description: film.synopsis };
}

export default async function WatchPage({ params, searchParams }: WatchProps) {
  const film = await getFilm(params);
  const { t } = await searchParams;
  const seconds = typeof t === "string" && /^\d+$/.test(t) ? Number(t) : 0;
  const start = seconds < film.duration ? seconds : 0;
  const scene = film.scenes.find((entry) => entry.seconds === start);

  return (
    <main className="page-width watch-page">
      <Link className="back-link" href="/library"><span aria-hidden="true">←</span> Back to library</Link>
      <header className="watch-heading">
        <p className="eyebrow">{film.series} · {film.genre} · {timestamp(film.duration)}</p>
        <h1 id="film-title">{film.title}</h1>
        <p id="film-synopsis">{film.synopsis}</p>
      </header>
      <figure>
        <video
          key={start}
          className="player"
          controls
          playsInline
          preload="metadata"
          aria-labelledby="film-title"
          aria-describedby="film-synopsis"
          poster={scene?.image ?? (start === 0 ? film.poster : undefined)}
          src={start ? `${film.source}#t=${start}` : film.source}
        >
          <a href={film.source}>Download the {film.title} excerpt</a>
        </video>
        <figcaption className="clip-details">
          <a href={film.original}>Original film by {film.studio}</a>
          <a href={film.licenseUrl}>{film.license}</a>
        </figcaption>
      </figure>
      <section className="scene-section" aria-labelledby="watch-scenes">
        <h2 id="watch-scenes">Scenes in this film</h2>
        <div className="scene-grid">
          {film.scenes.map((entry) => <SceneCard key={entry.seconds} film={film} scene={entry} />)}
        </div>
      </section>
    </main>
  );
}
