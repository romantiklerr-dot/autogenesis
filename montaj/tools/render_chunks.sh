#!/usr/bin/env bash
# Resumable render: video in 1000-frame chunks (finished chunks are skipped on re-run),
# audio rendered once, then concatenated, loudness-normalised to -14 LUFS and muxed into ../hazir.
set -euo pipefail
cd "$(dirname "$0")/.."
FFDIR=node_modules/@remotion/compositor-win32-x64-msvc
OUT=build
mkdir -p "$OUT" ../hazir
TOTAL=13004
CHUNK=1000

for ((s = 0; s < TOTAL; s += CHUNK)); do
  e=$((s + CHUNK - 1)); ((e >= TOTAL)) && e=$((TOTAL - 1))
  f=$(printf "%s/part_%05d.mp4" "$OUT" "$s")
  [[ -f "$f" ]] && { echo "skip $f"; continue; }
  npx remotion render src/index.ts AutoGenesis "$f.tmp.mp4" --frames="$s-$e" --muted --concurrency=3 --timeout=180000 --log=error
  mv "$f.tmp.mp4" "$f"
  echo "done $f"
done

[[ -f "$OUT/audio.wav" ]] || npx remotion render src/index.ts AutoGenesis "$OUT/audio.wav" --codec=wav --audio-codec=pcm-16 --config=tools/audio.config.ts --log=error

: > "$OUT/list.txt"
for f in "$OUT"/part_*.mp4; do [[ "$f" == *.tmp.mp4 ]] || echo "file '$(basename "$f")'" >> "$OUT/list.txt"; done
"$FFDIR/ffmpeg.exe" -y -v error -f concat -safe 0 -i "$OUT/list.txt" -c copy "$OUT/video.mp4"
"$FFDIR/ffmpeg.exe" -y -v error -i "$OUT/video.mp4" -i "$OUT/audio.wav" -map 0:v -map 1:a -c:v copy \
  -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 320k -movflags +faststart ../hazir/autogenesis_alfa156.mp4
echo "FINISHED"
