# Demo Video

- `demo-video-preview.mp4` — compressed 720p preview (~16MB), committed for GitHub in-browser playback.
- `demo-video.mp4` — original full-quality video (~409MB), kept local only.

To regenerate the preview:

```bash
ffmpeg -i assets/demo-video.mp4 \
  -vf "scale=1280:-2" \
  -c:v libx264 -preset medium -crf 30 \
  -c:a aac -b:a 64k -ac 1 \
  -movflags +faststart \
  assets/demo-video-preview.mp4
```
