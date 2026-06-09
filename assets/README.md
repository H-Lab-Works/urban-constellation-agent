# Demo Video

- Public demo: https://www.bilibili.com/video/BV1WyEm6WEut/
- `demo-video.mp4` — original full-quality video (~409MB), kept local only.
- `demo-video-preview.mp4` — compressed local copy for re-upload or backup.

To regenerate the preview:

```bash
ffmpeg -i assets/demo-video.mp4 \
  -vf "scale=854:-2" \
  -c:v libx264 -preset medium -crf 34 \
  -c:a aac -b:a 48k -ac 1 \
  -movflags +faststart \
  assets/demo-video-preview.mp4
```
