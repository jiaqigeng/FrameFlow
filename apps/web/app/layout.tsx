import type { Metadata } from "next";
import { Navigation } from "./navigation";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Processing dashboard · FrameFlow", template: "%s · FrameFlow" },
  description: "Add a video, follow its processing job, and play it from your FrameFlow library.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="masthead">
          <Navigation />
        </header>
        {children}
      </body>
    </html>
  );
}
