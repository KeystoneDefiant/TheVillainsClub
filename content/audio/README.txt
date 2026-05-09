House band clips live under `content/audio/bands/<band_id>/` only (music + interludes). Vite copies this tree into `dist/audio/bands` during `npm run build` and serves those URLs from disk in dev; do not duplicate tracks under `public/`.
The active band schedule and file lists are in `content/bands.json` (imported by the shell at build time).
