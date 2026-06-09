# Demo Video

- `demo-video-preview.mp4` — compressed 480p preview (~7MB), embedded in README for in-page playback.
- `demo-video.mp4` — original full-quality video (~409MB), kept local only.

To regenerate the preview:

```bash
ffmpeg -i assets/demo-video.mp4 \
  -vf "scale=854:-2" \
  -c:v libx264 -preset medium -crf 34 \
  -c:a aac -b:a 48k -ac 1 \
  -movflags +faststart \
  assets/demo-video-preview.mp4
```
