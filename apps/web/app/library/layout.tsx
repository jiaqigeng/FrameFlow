import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Video library" };

export default async function LibraryLayout({ children }: { children: ReactNode }) {
  // Include the current search in the first response as well as on client navigation.
  await connection();
  return children;
}
