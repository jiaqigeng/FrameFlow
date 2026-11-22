# FrameFlow

FrameFlow is a planned video platform for uploading and streaming large videos, reading a summary, and finding the moment a topic comes up.

## Upload, processing, and playback

- Users will upload large video files directly from their browsers to Amazon S3.
- Amazon SQS will queue processing jobs. Distributed workers will pick up each job and use FFmpeg to transcode the video into multiple resolutions in the background.
- Viewers will stream the processed videos through Amazon CloudFront.

## Understanding and searching videos

- FrameFlow will transcribe spoken audio and generate a summary for each video.
- Viewers will be able to search by meaning. FrameFlow will match a query against embeddings of timestamped transcript segments stored in PostgreSQL with pgvector. For example, a search for “How do I roll back a release?” could take a viewer to 08:42, where the speaker explains how to restore the previous version.
- Fine-tuned machine learning models will classify videos by their content.
