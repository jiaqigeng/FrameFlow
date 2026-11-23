import { spawnSync } from "node:child_process";
import { cp, mkdir, opendir, rename, rm, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = fileURLToPath(new URL("../apps/web/", import.meta.url));
const appRequire = createRequire(path.join(app, "package.json"));
const next = appRequire.resolve("next/dist/bin/next");
const build = spawnSync(process.execPath, [next, "build", "--webpack"], {
  cwd: app,
  env: { ...process.env, FRAMEFLOW_AMPLIFY_BUILD: "1" },
  stdio: "inherit",
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const output = path.join(app, ".amplify-hosting");
const compute = path.join(output, "compute", "default");
const assets = path.join(output, "static");
const standalone = path.join(app, ".next", "standalone");

// The trace uses the workspace root, so the Next server is nested under apps/web.
await stat(path.join(standalone, "apps", "web", "server.js"));
await rm(output, { recursive: true, force: true });
await mkdir(path.dirname(compute), { recursive: true });
await rename(standalone, compute);
await writeFile(path.join(compute, "index.cjs"), [
  'process.env.HOSTNAME = "0.0.0.0";',
  'require("./apps/web/server.js");',
  "",
].join("\n"));

await cp(path.join(app, "public"), assets, { recursive: true });
await cp(path.join(app, ".next", "static"), path.join(assets, "_next", "static"), { recursive: true });

const manifest = {
  version: 1,
  framework: { name: "next", version: appRequire("next/package.json").version },
  routes: [
    {
      path: "/_next/static/*",
      target: { kind: "Static", cacheControl: "public, max-age=31536000, immutable" },
    },
    { path: "/media/*", target: { kind: "Static" } },
    { path: "/*", target: { kind: "Compute", src: "default" } },
  ],
  computeResources: [{ name: "default", runtime: "nodejs24.x", entrypoint: "index.cjs" }],
};

let bytes = 0;
for await (const entry of await opendir(compute, { recursive: true })) {
  if (entry.isFile()) bytes += (await stat(path.join(entry.parentPath, entry.name))).size;
}
if (bytes > 220 * 1024 * 1024) throw new Error("Compute bundle exceeds Amplify's 220 MiB limit.");

await writeFile(path.join(output, "deploy-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Amplify Hosting bundle ready (${(bytes / 1024 / 1024).toFixed(1)} MiB compute).`);
