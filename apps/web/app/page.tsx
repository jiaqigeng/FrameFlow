import type { Metadata } from "next";
import { SignInPage } from "./sign-in-page";

export const metadata: Metadata = { title: "Sign in" };

export default function Home() {
  return <SignInPage />;
}
