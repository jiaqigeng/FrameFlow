# FrameFlow

FrameFlow lets you add a video, follow its processing job, and watch the result in a library. The current dashboard runs locally. Each job reads the file’s duration and extracts a thumbnail in the browser. IndexedDB stores the original video, thumbnail, and job status between visits.

![Adding a video to the FrameFlow dashboard, processing it and opening the result](docs/media/player-demo.gif)

## Try the dashboard

Use Node.js 24 and pnpm 11.25.0. Run these commands from the repository root.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

1. Open [localhost:3000](http://localhost:3000). After the filmstrip moves up, select **Sign in** to enter the demo. You can leave the fields as they are.
2. On the dashboard, select **Process sample** or drag in your own video. The bundled sample follows the same processing path as a local file.
3. When the queue shows **Ready**, select **Watch**. Reload the page to play the saved copy again in the same browser.
4. Open **Library** to browse processed videos and the original sample. Search for `mine cart` and select the matching scene to jump to 0:15. The sample’s three scenes have hand-written descriptions.

The demo requires no account or AWS credentials. Files you add are private to this browser’s storage for this site. A watch link for an uploaded file works only where the file is stored. Remove a job from the dashboard to delete its stored copy.

If pnpm is missing, install it with `npm install --global pnpm@11.25.0`. On Windows, `npm.cmd` and `pnpm.cmd` also work in PowerShell.

Run `pnpm typecheck` and `pnpm build` to check the project. Use `pnpm start` to serve the production build. GitHub Actions runs the checks for pull requests and changes to `main`.

## Sample film

**Caminandes: Llamigos** is a 2016 animated short from Blender Foundation, directed by Pablo Vazquez, with music by Torin Borrowdale and sound design by Sander Houtman. FrameFlow uses 0:49.875–1:41.792 of the film, re-encoded at 720p with brief audio fades at the cut points. The opening animation, poster, scene thumbnails, and demo preview use frames from this excerpt. [Original film](https://www.youtube.com/watch?v=SkVqJ1SGeL0) · [Blender’s source MP4](https://video.blender.org/download/web-videos/23f3ef79-15dc-44c5-aa45-cf92e78a4509-1080.mp4) · [Creative Commons Attribution 3.0 license](https://creativecommons.org/licenses/by/3.0/)

## Planned features

### Upload, processing, and playback

- Users will upload large video files directly from their browsers to Amazon S3.
- Amazon SQS will queue processing jobs. Distributed workers will pick up each job and use FFmpeg to transcode the video into multiple resolutions in the background.
- Viewers will stream the processed videos through Amazon CloudFront.

### Understanding and searching videos

- FrameFlow will transcribe spoken audio and generate a summary for each video.
- Viewers will be able to search by meaning. FrameFlow will match a query against embeddings of timestamped transcript segments stored in PostgreSQL with pgvector.
- Fine-tuned machine learning models will classify videos by their content.
