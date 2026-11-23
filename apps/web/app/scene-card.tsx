import Image from "next/image";
import Link from "next/link";
import { type Film, type Scene, timestamp } from "./catalog";

export function SceneCard({ film, scene }: { film: Film; scene: Scene }) {
  return (
    <Link className="scene-card" href={`/watch/${film.slug}?t=${scene.seconds}`}>
      <div className="scene-art">
        <Image src={scene.image} alt="" width={640} height={360} unoptimized />
        <span className="time-chip">{timestamp(scene.seconds)}</span>
      </div>
      <div className="scene-copy">
        <p className="scene-title">{scene.title}</p>
        <p className="scene-film">{film.series} · {film.title}</p>
      </div>
    </Link>
  );
}
