# FrameFlow

FrameFlow is a video platform in development. The first milestone is a local Next.js player for **Release recovery**, an original 40-second simulation with synthesized narration and English captions. Play the clip or seek to **0:23** to hear how the team responds when checkout errors reach 8%.

![FrameFlow playing and seeking through the sample video](docs/media/player-demo.gif)

## Run the player locally

Use Node.js 24 and pnpm 11.25.0. Run these commands from the repository root.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000) or the address printed by Next.js. The sample video, poster, and captions are included in the repository. Playback works locally without an account or cloud services.

If pnpm is missing, install it with `npm install --global pnpm@11.25.0`. On Windows, `npm.cmd` and `pnpm.cmd` also work in PowerShell.

Run `pnpm typecheck` and `pnpm build` to check the project. Use `pnpm start` to serve the production build. GitHub Actions runs the checks for pull requests and changes to `main`.

## Planned features

### Upload, processing, and playback

- Users will upload large video files directly from their browsers to Amazon S3.
- Amazon SQS will queue processing jobs. Distributed workers will pick up each job and use FFmpeg to transcode the video into multiple resolutions in the background.
- Viewers will stream the processed videos through Amazon CloudFront.

### Understanding and searching videos

- FrameFlow will transcribe spoken audio and generate a summary for each video.
- Viewers will be able to search by meaning. FrameFlow will match a query against embeddings of timestamped transcript segments stored in PostgreSQL with pgvector. For example, a search for “How do I roll back a release?” could take a viewer to 08:42, where the speaker explains how to restore the previous version.
- Fine-tuned machine learning models will classify videos by their content.
