#!/usr/bin/env bash
# =============================================================================
#  The Founder's Sprint — specialty video encoder
# -----------------------------------------------------------------------------
#  Turns a camera/edit master into a web-deliverable pair:
#      <slug>.mp4   720x1280 vertical, H.264, faststart, speech audio
#      <slug>.jpg   poster frame (what a visitor downloads if they never tap)
#
#  Usage:
#     tools/encode-specialty-video.sh <master.mp4> <specialty-slug> [outdir]
#     tools/encode-specialty-video.sh --all <masters-dir> <outdir>
#
#  WHY THESE SETTINGS — measured, not guessed (6 Oct 2026):
#    The launch-reel masters are 1080x1920 @ 5.78 Mbps = 41.5 MB per minute.
#    A 2-minute specialty video at that rate is ~83 MB, which is unservable to
#    a founder on Kampala mobile data. Re-encoded at 720x1280 the same minute
#    came out at 2.27 MB (CRF 26) — a 18x reduction with no visible loss on a
#    phone, measured on a text-heavy reel which is HARDER to encode than a
#    talking head, so real specialty videos should land at or below this.
#
#    CRF 26, not the 28 used for background loops elsewhere in the project.
#    Background video sits behind a B&W filter and a vignette where nobody
#    reads detail; these are foreground explainers with a face and on-screen
#    text, where 26 buys legibility for ~0.9 MB a minute. Worth it.
#
#    Videos are NEVER truncated. They are scripted as whole pieces and a
#    45-second cut would carry a different message (Teddy, 6 Oct 2026).
#    This script only ever re-encodes; it has no trim path on purpose.
#
#    Audio is kept (64k mono AAC). The project's other ffmpeg recipe strips
#    audio with -an because those are muted background loops. A talking head
#    with no audio is not a talking head.
#
#    -movflags +faststart puts the moov atom first so playback begins before
#    the file finishes downloading. On 3G this is the difference between a
#    video that starts and one the visitor abandons.
# =============================================================================
set -euo pipefail

CRF="${FS_CRF:-26}"
AUDIO_KBPS="${FS_AUDIO_KBPS:-64}"
POSTER_AT="${FS_POSTER_AT:-}"   # seconds; default = 1s in (avoids black frame 0)

need() { command -v "$1" >/dev/null 2>&1 || { echo "error: $1 not found on PATH" >&2; exit 1; }; }
need ffmpeg
need ffprobe

encode_one() {
  local src="$1" slug="$2" outdir="$3"
  [ -f "$src" ] || { echo "error: no such master: $src" >&2; return 1; }
  mkdir -p "$outdir"

  local mp4="$outdir/$slug.mp4"
  local jpg="$outdir/$slug.jpg"

  local dur src_mb
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src" | cut -d. -f1)
  src_mb=$(( $(stat -f%z "$src" 2>/dev/null || stat -c%s "$src") / 1048576 ))

  echo "── $slug"
  echo "   master : ${src_mb} MB · ${dur}s"

  # Full length. scale= with force_original_aspect_ratio=decrease caps the long
  # edge at 1280 while preserving the source aspect, so a 9:16 reel stays 9:16
  # and a horizontal clip is letterboxed by the player, not by us. pad= forces
  # even dimensions, which H.264 requires.
  ffmpeg -y -v error -stats -i "$src" \
    -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" \
    -c:v libx264 -preset slow -crf "$CRF" -profile:v main -level 4.0 \
    -movflags +faststart -pix_fmt yuv420p \
    -c:a aac -b:a "${AUDIO_KBPS}k" -ac 1 \
    "$mp4"

  # Poster frame. 1s in by default — frame 0 is usually a fade-from-black, and
  # a black poster reads as a broken player.
  local at="${POSTER_AT:-1}"
  ffmpeg -y -v error -ss "$at" -i "$src" -frames:v 1 \
    -vf "scale=720:1280:force_original_aspect_ratio=decrease" \
    -q:v 4 "$jpg"

  local out_mb out_kb poster_kb
  out_kb=$(( $(stat -f%z "$mp4" 2>/dev/null || stat -c%s "$mp4") / 1024 ))
  poster_kb=$(( $(stat -f%z "$jpg" 2>/dev/null || stat -c%s "$jpg") / 1024 ))
  out_mb=$(awk "BEGIN{printf \"%.2f\", $out_kb/1024}")

  echo "   video  : ${out_mb} MB  (crf $CRF, ${AUDIO_KBPS}k mono audio, faststart)"
  echo "   poster : ${poster_kb} KB"
  awk "BEGIN{printf \"   saved  : %.0f%% off the master\n\", (1-($out_kb/1024)/$src_mb)*100}"
  echo
}

if [ "${1:-}" = "--all" ]; then
  masters="${2:?usage: --all <masters-dir> <outdir>}"
  outdir="${3:?usage: --all <masters-dir> <outdir>}"
  shopt -s nullglob
  for f in "$masters"/*.mp4 "$masters"/*.mov "$masters"/*.MP4 "$masters"/*.MOV; do
    base=$(basename "$f"); base="${base%.*}"
    # Filename → slug: lowercase, non-alphanumerics to single hyphens.
    slug=$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
    encode_one "$f" "$slug" "$outdir"
  done
else
  src="${1:?usage: encode-specialty-video.sh <master.mp4> <specialty-slug> [outdir]}"
  slug="${2:?usage: encode-specialty-video.sh <master.mp4> <specialty-slug> [outdir]}"
  outdir="${3:-media/specialty}"
  encode_one "$src" "$slug" "$outdir"
fi

cat <<'NOTE'
Next: upload the pair to the R2 bucket and keep the filenames as-is — the
landing pages resolve <slug>.mp4 / <slug>.jpg against FS_MEDIA_BASE, so no page
edit is needed when a video lands.

  rclone copy media/specialty r2:fs-media/specialty --progress

A slug with no file simply renders no video block. Pages never show a broken
player while you are still shooting.
NOTE
