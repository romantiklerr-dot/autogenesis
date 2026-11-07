#!/usr/bin/env bash
# 8 Noyabr – Zəfər Günü montajı. İstifadə: ./build.sh mənbə.mp4
set -euo pipefail
IN="$1"; cd "$(dirname "$0")"
# 1) Əsas görüntü: orijinal + 4.5–13 san. hissənin yavaş çəkimi, rəng korreksiyası, yavaş zoom
ffmpeg -v error -y -i "$IN" -filter_complex "
[0:v]fps=30,split[v1][v2];
[v1]trim=0:13.06,setpts=PTS-STARTPTS,format=yuv420p[a];
[v2]trim=4.5:13.06,setpts=2*(PTS-STARTPTS),minterpolate=fps=30:mi_mode=blend,format=yuv420p[b];
[a][b]xfade=transition=fade:duration=0.6:offset=12.45,eq=contrast=1.07:saturation=1.18:gamma=0.97,
scale=1080:1920:flags=lanczos,zoompan=z='1.0+0.10*on/890':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=30,setsar=1[out]" \
  -map "[out]" -an -c:v libx264 -crf 14 -preset fast base.mp4
# 2) Səs: orijinal mühit səsi + sintez pad və zərbələr
python3 pad.py pad.wav
ffmpeg -v error -y -i "$IN" -i "$IN" -i pad.wav -filter_complex "
[0:a]atrim=0:13.06,asetpts=PTS-STARTPTS[a1];[1:a]atrim=0:13.06,asetpts=PTS-STARTPTS,atempo=0.75[a2];
[a1][a2]acrossfade=d=1.0,atrim=0:29.5,volume=1.6,highpass=f=80[amb];
[2:a]lowpass=f=2200,aecho=0.8:0.7:120|260:0.35|0.22,volume=0.42[pad];
[amb][pad]amix=inputs=2:normalize=0,afade=t=in:d=0.3,afade=t=out:st=28.3:d=1.2,alimiter=limit=0.89[out]" \
  -map "[out]" -c:a pcm_s16le mix.wav
# 3) Animasiyalı mətn qatları + yekun kodlaşdırma
ffmpeg -v error -i base.mp4 -f rawvideo -pix_fmt rgb24 - | python3 overlay.py \
 | ffmpeg -v error -y -f rawvideo -pix_fmt rgb24 -s 720x1280 -r 30 -i - -i mix.wav \
   -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
   -c:a aac -b:a 192k -movflags +faststart -shortest zafer_gunu_8_noyabr.mp4
rm -f base.mp4 pad.wav mix.wav
