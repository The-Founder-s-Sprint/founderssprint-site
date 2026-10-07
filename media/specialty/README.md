# Specialty videos — encoded, pre-upload staging

Drop encoded pairs here as `<specialty-slug>.mp4` + `<specialty-slug>.jpg`:

    tools/encode-specialty-video.sh "Master.mp4" pitch-deck-structure media/specialty

Then re-run the page generator and upload to R2:

    node tools/build-specialty-pages.js
    rclone copy media/specialty r2:fs-media/specialty --progress

The generator decides whether to render the video block by looking in THIS
directory at build time. A slug with no file here simply omits the block, so a
page never shows a dead player while filming is still in progress.

The page also self-heals: it probes its own poster on load and removes the whole
video card if the media is missing from R2 — a bad upload or a typo'd filename
degrades to no video rather than a broken player on a page being promoted.

## Encoding settings, and why

Measured 6 Oct 2026 against a real launch-reel master:

| | |
|---|---|
| Master | 1080×1920 @ 5.78 Mbps = **41.5 MB/minute** |
| Encoded | 720×1280, CRF 26, 64k mono AAC = **2.28 MB/minute** |
| Saving | **94%** — a 2-minute video is ~4.6 MB plus a ~40 KB poster |

CRF 26, not the 28 used for the site's background loops. Those sit behind a B&W
filter and a vignette where nobody reads detail; these are foreground explainers
with a face and on-screen text, where 26 buys legibility for ~0.9 MB a minute.

Audio is kept. The background-loop recipe strips it with `-an`, which would
silence a talking head.

Videos are never trimmed. They are scripted as whole pieces and a shorter cut
carries a different message (Teddy, 6 Oct 2026) — the encoder has no trim path.

## Nothing here is committed

See `.gitignore`. Video belongs on R2, not in git: 49 clips at ~4 MB each would
permanently bloat the repository, and git keeps every revision of a binary
forever. R2 serves them for effectively nothing — 10 GB storage and 10M reads a
month are free, and egress is free at every tier.
