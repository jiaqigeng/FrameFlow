export interface Scene {
  seconds: number;
  title: string;
  description: string;
  image: string;
}

export interface Film {
  slug: string;
  title: string;
  series: string;
  genre: string;
  studio: string;
  synopsis: string;
  duration: number;
  poster: string;
  source: string;
  original: string;
  license: string;
  licenseUrl: string;
  scenes: Scene[];
}

export const films: Film[] = [
  {
    slug: "llamigos",
    title: "Llamigos",
    series: "Caminandes",
    genre: "Animation",
    studio: "Blender Foundation",
    synopsis: "It’s winter in Patagonia. Koro the llama and Oti the penguin both have their eye on the same berry.",
    duration: 52,
    poster: "/media/llamigos.jpg",
    source: "/media/llamigos.mp4",
    original: "https://www.youtube.com/watch?v=SkVqJ1SGeL0",
    license: "Creative Commons Attribution 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    scenes: [
      {
        seconds: 1,
        title: "Koro tosses a berry",
        description: "The llama flicks a red berry off his tongue in the snow.",
        image: "/media/llamigos-scene-1.jpg",
      },
      {
        seconds: 15,
        title: "Inside the mine cart",
        description: "The llama and penguin ride a wooden cart down the tracks in a dark cave.",
        image: "/media/llamigos-scene-2.jpg",
      },
      {
        seconds: 32,
        title: "Airborne over Patagonia",
        description: "Koro flies over snow-covered mountains under a blue sky.",
        image: "/media/llamigos-scene-3.jpg",
      },
    ],
  },
];

export function timestamp(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
