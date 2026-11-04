# Shortens long pauses in the narration so the edit flows, and writes a time map
# (original seconds -> edited seconds) so transcript timestamps can be remapped.
import json, re, subprocess, sys, os

ROOT = os.path.join(os.path.dirname(__file__), '..')
FF = os.path.join(ROOT, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe')
SRC = os.path.join(ROOT, 'public', 'narration.mp3')
OUT = os.path.join(ROOT, 'public', 'narration_tight.wav')
MAX_GAP = 0.42  # longest pause kept, seconds

log = subprocess.run([FF, '-hide_banner', '-i', SRC, '-af', 'silencedetect=noise=-38dB:d=0.45', '-f', 'null', '-'], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
dur = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', log).groups()[2]) + 60 * int(re.search(r'Duration: (\d+):(\d+)', log).groups()[1])

cuts = []  # (cut_start, cut_end) in original time
for s, e in zip(starts, ends):
    if e - s > MAX_GAP:
        half = MAX_GAP / 2
        cuts.append((s + half, e - half))

keep, t = [], 0.0
for a, b in cuts:
    keep.append((t, a)); t = b
keep.append((t, dur))

# Cuts land inside silence, so a plain concat is click-free (the bundled ffmpeg has no afade).
parts = ''.join(f'[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS[a{i}];' for i, (a, b) in enumerate(keep))
fc = parts + ''.join(f'[a{i}]' for i in range(len(keep))) + f'concat=n={len(keep)}:v=0:a=1[out]'
with open(os.path.join(ROOT, 'tools', 'fc.txt'), 'w') as fh:
    fh.write(fc)
subprocess.run([FF, '-y', '-v', 'error', '-i', SRC, '-filter_complex_script', os.path.join(ROOT, 'tools', 'fc.txt'), '-map', '[out]', '-ar', '48000', OUT], check=True)

segs, acc = [], 0.0
for a, b in keep:
    segs.append({'src': a, 'dst': acc, 'len': b - a}); acc += b - a
json.dump({'segments': segs, 'duration': acc, 'original': dur}, open(os.path.join(ROOT, 'tools', 'timemap.json'), 'w'), indent=1)
print(f'original {dur:.2f}s -> tightened {acc:.2f}s, {len(cuts)} pauses shortened')
