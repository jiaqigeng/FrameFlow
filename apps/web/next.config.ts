import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(process.env.FRAMEFLOW_AMPLIFY_BUILD === "1" && {
    output: "standalone",
    outputFileTracingRoot: path.resolve(__dirname, "../.."),
  }),
};

export default nextConfig;
