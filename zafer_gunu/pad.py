"""Soft, solemn synth pad + low booms for the Victory Day edit (29.5 s)."""
import sys, wave
import numpy as np

SR = 44100
DUR = 29.5
t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)

# D minor -> Bb -> F -> C -> Dm(sus) ... heroic, slow
chords = [
    (0.0, [50, 57, 62, 65, 69]),   # Dm
    (6.0, [46, 53, 62, 65, 70]),   # Bb
    (12.0, [41, 53, 60, 65, 69]),  # F
    (18.0, [48, 55, 60, 64, 67]),  # C
    (23.8, [50, 57, 62, 66, 69]),  # D major (triumphant finale)
]
for i, (start, notes) in enumerate(chords):
    end = chords[i + 1][0] + 1.5 if i + 1 < len(chords) else DUR
    seg = (t >= start) & (t < end)
    tt = t[seg] - start
    length = end - start
    env = np.minimum(1, tt / 1.8) * np.minimum(1, (length - tt) / 1.5).clip(0, 1)
    sig = np.zeros_like(tt)
    for n in notes:
        f = midi(n)
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            sig += np.sin(2 * np.pi * ff * tt) + 0.30 * np.sin(4 * np.pi * ff * tt) + 0.12 * np.sin(6 * np.pi * ff * tt)
    lfo = 1 + 0.08 * np.sin(2 * np.pi * 0.25 * tt)
    out[seg] += sig * env * lfo / (len(notes) * 3)

# Low cinematic booms
def boom(at, gain):
    seg = t >= at
    tt = t[seg] - at
    f = 55 * np.exp(-tt * 1.5) + 32
    phase = 2 * np.pi * np.cumsum(f) / SR
    out[seg] += gain * np.sin(phase) * np.exp(-tt * 2.2)

boom(0.25, 1.4)
boom(3.6, 0.6)
boom(25.0, 1.6)

out /= np.max(np.abs(out)) + 1e-9
out *= 0.9
pcm = (out * 32767).astype(np.int16)
stereo = np.stack([pcm, pcm], axis=1)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(stereo.tobytes())
