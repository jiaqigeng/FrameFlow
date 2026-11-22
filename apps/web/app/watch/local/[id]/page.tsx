import type { Metadata } from "next";
import { LocalPlayer } from "./player";

export const metadata: Metadata = { title: "Your video" };

export default async function WatchLocal({ params }: PageProps<"/watch/local/[id]">) {
  const { id } = await params;
  return <LocalPlayer key={id} id={id} />;
}
