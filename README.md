# FrameFlow

FrameFlow is a video platform in development. The local Next.js player features NASA’s **Apollo 11** recording of Neil Armstrong’s first step on the Moon. Play the clip from the beginning to hear his description of the lunar dust, or seek to **0:48** for his first words on the surface.

![FrameFlow playing and seeking through NASA’s Apollo 11 footage](docs/media/player-demo.gif)

NASA recorded the footage and mission audio in July 1969. Wikimedia Commons identifies the recording as public domain in the United States. The player includes a local MP4, a still from the recording, and English captions. [Footage and reuse information on Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Apollo_11_Landing_-_first_steps_on_the_moon.ogv)

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
- Viewers will be able to search by meaning. FrameFlow will match a query against embeddings of timestamped transcript segments stored in PostgreSQL with pgvector. For example, “What was the lunar soil like?” could take a viewer to the moment Armstrong compares the surface to powder.
- Fine-tuned machine learning models will classify videos by their content.
