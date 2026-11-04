# Synthesizes the few sound effects used in the edit (48 kHz, 16-bit WAV).
import numpy as np, wave, os

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def save(name, x, stereo_width=0.0):
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    if stereo_width:
        d = int(SR * 0.012)
        r = np.concatenate([np.zeros(d), x[:-d]])
        st = np.stack([x, x * (1 - stereo_width) + r * stereo_width], 1)
    else:
        st = np.stack([x, x], 1)
    pcm = (st * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, name + '.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def t(dur):
    return np.arange(int(SR * dur)) / SR


def lowpass(x, cutoff):
    # one-pole lowpass with time-varying cutoff (array or scalar)
    cutoff = np.broadcast_to(cutoff, x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s
        y[i] = s
    return y


def env(n, attack, release):
    e = np.ones(n)
    a = int(SR * attack); r = int(SR * release)
    e[:a] = np.linspace(0, 1, a) ** 2
    e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


# Soft whoosh: band-limited noise with a sweeping filter, bell-shaped envelope
def whoosh(dur=0.9, lo=300, hi=3200):
    n = int(SR * dur); tt = np.linspace(0, 1, n)
    shape = np.sin(np.pi * tt) ** 2.2
    cut = lo + (hi - lo) * np.sin(np.pi * tt) ** 1.5
    noise = rng.standard_normal(n)
    y = lowpass(noise, cut) - lowpass(noise, cut * 0.25)
    return y * shape


# Gentle impact: sub sine drop + filtered noise tail
def impact(dur=2.2):
    tt = t(dur)
    f = 55 * np.exp(-tt * 1.4) + 32
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-tt * 2.2)
    tail = lowpass(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 3.5) * 0.6
    return (sub + tail) * env(len(tt), 0.004, 0.6)


# Riser: rising filtered noise + rising sine, for intro build-up
def riser(dur=2.6):
    tt = t(dur); p = tt / dur
    noise = rng.standard_normal(len(tt))
    y = lowpass(noise, 200 + 5000 * p ** 2) * p ** 2
    tone = np.sin(2 * np.pi * np.cumsum(180 + 520 * p ** 2) / SR) * p ** 3 * 0.25
    return (y + tone) * env(len(tt), 0.05, 0.08)


# Soft UI pop for list items / chips
def pop(freq=880, dur=0.22):
    tt = t(dur)
    f = freq * (1 + 0.6 * np.exp(-tt * 40))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 22)
    y += 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * np.exp(-tt * 35)
    return y * env(len(tt), 0.002, 0.05)


# Shimmer for logo reveal: stacked detuned partials with slow decay
def shimmer(dur=2.4):
    tt = t(dur); y = np.zeros(len(tt))
    for k, f in enumerate([523.25, 659.25, 783.99, 1046.5, 1318.5]):
        y += np.sin(2 * np.pi * f * tt + k) * np.exp(-tt * (1.4 + k * 0.35)) / (1 + k * 0.4)
    return y * env(len(tt), 0.01, 0.8)


# Ambient bed: slow evolving pad (Am add9 voicing), designed to sit very low under narration
def pad(dur=30.0):
    tt = t(dur); y = np.zeros(len(tt))
    for f, a in [(110, 1), (164.81, 0.7), (220, 0.6), (246.94, 0.35), (329.63, 0.3)]:
        for det in (-0.35, 0.35):
            lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (0.05 + f / 9000) * tt + f)
            y += a * np.sin(2 * np.pi * (f + det) * tt) * (0.6 + 0.4 * lfo)
    y = lowpass(y, 1400)
    # seamless loop: crossfade tail into head
    x = int(SR * 3); y[:x] = y[:x] * np.linspace(0, 1, x) + y[-x:] * np.linspace(1, 0, x)
    return y[:-x]


save('whoosh', whoosh(), 0.5)
save('whoosh_soft', whoosh(1.3, 200, 1800), 0.5)
save('impact', impact(), 0.3)
save('riser', riser(), 0.6)
save('pop', pop())
save('shimmer', shimmer(), 0.6)
save('pad', pad(), 0.7)
print('ok')
