"""Animated text overlays for the 8 Noyabr – Zəfər Günü edit.

Reads raw RGB frames of base.mp4 on stdin, writes composited frames to stdout.
usage: ffmpeg ... -f rawvideo -pix_fmt rgb24 - | python3 overlay.py | ffmpeg ...
"""
import math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 720, 1280, 30
TOTAL = 885
SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SANS = '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf'
SANS_R = '/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf'

BLUE = (0, 181, 226)
RED = (239, 51, 64)
GREEN = (80, 158, 47)
GOLD = (255, 205, 92)
WHITE = (255, 255, 255)

def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))

def ease_out(x):
    x = clamp(x); return 1 - (1 - x) ** 3

def ease_in_out(x):
    x = clamp(x); return 3 * x * x - 2 * x * x * x

def back_out(x, s=1.7):
    x = clamp(x) - 1; return x * x * ((s + 1) * x + s) + 1

def lerp(a, b, k):
    return a + (b - a) * k

def font(path, size):
    return ImageFont.truetype(path, size)

# ---------------------------------------------------------------- sprites
def text_sprite(text, fnt, fill, glow=None, glow_r=10, shadow=True, pad=30):
    """Render text into an RGBA sprite with soft shadow / glow."""
    bbox = list(fnt.getbbox(text))
    ref = fnt.getbbox('ŞÇÜƏÖİgjyh|')
    bbox[1], bbox[3] = ref[1], ref[3]
    w, h = bbox[2] - bbox[0] + pad * 2, bbox[3] - bbox[1] + pad * 2
    base = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    org = (pad - bbox[0], pad - bbox[1])
    if shadow:
        sh = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((org[0] + 2, org[1] + 3), text, font=fnt, fill=(0, 0, 0, 200))
        base = Image.alpha_composite(base, sh.filter(ImageFilter.GaussianBlur(5)))
    if glow:
        gl = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(gl).text(org, text, font=fnt, fill=glow)
        g = gl.filter(ImageFilter.GaussianBlur(glow_r))
        base = Image.alpha_composite(base, g)
        base = Image.alpha_composite(base, g)
    ImageDraw.Draw(base).text(org, text, font=fnt, fill=fill)
    return base, pad

def with_alpha(img, a):
    if a >= 0.999:
        return img
    if a <= 0.001:
        return None
    r, g, b, al = img.split()
    al = al.point(lambda v: int(v * a))
    return Image.merge('RGBA', (r, g, b, al))

def paste(canvas, sprite, x, y, a=1.0, scale=1.0, center=False):
    if scale != 1.0:
        sw, sh = sprite.size
        sprite = sprite.resize((max(1, int(sw * scale)), max(1, int(sh * scale))), Image.BICUBIC)
    s = with_alpha(sprite, a)
    if s is None:
        return
    if center:
        x -= s.size[0] / 2; y -= s.size[1] / 2
    canvas.alpha_composite(s, (int(round(x)), int(round(y))))

def make_flag(w=300, h=150):
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, h // 3], fill=BLUE + (255,))
    d.rectangle([0, h // 3, w, 2 * h // 3], fill=RED + (255,))
    d.rectangle([0, 2 * h // 3, w, h], fill=GREEN + (255,))
    cx, cy = w / 2 - h * 0.05, h / 2
    r1, r2 = h * 0.15, h * 0.125
    d.ellipse([cx - r1, cy - r1, cx + r1, cy + r1], fill=WHITE + (255,))
    d.ellipse([cx - r2 + h * 0.037, cy - r2, cx + r2 + h * 0.037, cy + r2], fill=RED + (255,))
    sx, sy, ro, ri = cx + h * 0.15, cy, h * 0.083, h * 0.035
    pts = []
    for i in range(16):
        ang = math.pi / 8 * i
        rr = ro if i % 2 == 0 else ri
        pts.append((sx + rr * math.cos(ang), sy + rr * math.sin(ang)))
    d.polygon(pts, fill=WHITE + (255,))
    return img

def wave_flag(flag, t, amp=7):
    """Waving flag: per-column vertical shift + shading."""
    arr = np.array(flag)
    h, w = arr.shape[:2]
    out = np.zeros((h + amp * 2 + 4, w, 4), dtype=np.uint8)
    for x in range(w):
        ph = x / w * 2.6 * math.pi - t * 6.0
        dy = int(round(math.sin(ph) * amp * (0.25 + 0.75 * x / w)))
        shade = 0.85 + 0.15 * math.cos(ph)
        col = arr[:, x].astype(np.float32)
        col[:, :3] *= shade
        out[amp + 2 + dy: amp + 2 + dy + h, x] = col.clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

# ---------------------------------------------------------------- static layers
grad = np.zeros((H, W, 4), dtype=np.uint8)
ys = np.arange(H)
top = np.clip(1 - ys / 330, 0, 1) ** 1.6 * 175
bot = np.clip((ys - 640) / 640, 0, 1) ** 1.3 * 215
grad[..., 3] = np.maximum(top, bot)[:, None].astype(np.uint8)
GRAD = Image.fromarray(grad, 'RGBA')

yy, xx = np.mgrid[0:H, 0:W]
dist = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
vig = np.zeros((H, W, 4), dtype=np.uint8)
vig[..., 3] = (np.clip(dist - 0.75, 0, 1) ** 1.5 * 230).astype(np.uint8)
VIGNETTE = Image.fromarray(vig, 'RGBA')

FLAG = make_flag(300, 150)
FLAG_SMALL = make_flag(84, 42)

# Intro / header sprites
F_BIG8 = font(SERIF, 230)
F_NOY = font(SERIF, 92)
F_ZAFER = font(SERIF, 70)
F_HDR = font(SERIF, 44)
F_HDR2 = font(SANS, 30)

SPR_8, P8 = text_sprite('8', F_BIG8, GOLD + (255,), glow=(255, 190, 60, 150), glow_r=18)
SPR_NOY, PN = text_sprite('NOYABR', F_NOY, WHITE + (255,), glow=(255, 255, 255, 60), glow_r=12)
ZAFER_LETTERS = []
for ch in 'ZƏFƏR GÜNÜ':
    ZAFER_LETTERS.append((ch, text_sprite(ch, F_ZAFER, GOLD + (255,), glow=(255, 180, 40, 140), glow_r=10)[0] if ch != ' ' else None,
                          F_ZAFER.getlength(ch)))
SPR_HDR, _ = text_sprite('8 NOYABR', F_HDR, WHITE + (255,), glow=(255, 255, 255, 50))
SPR_HDR2, _ = text_sprite('ZƏFƏR GÜNÜ', F_HDR2, GOLD + (255,), glow=(255, 180, 40, 120), glow_r=8)

# Captions: (start, end, text, emphasised words)
CAPTIONS = [
    (3.9, 8.7, '8 Noyabr – Azərbaycan tarixinin ən şanlı və qürurlu günlərindən biridir!',
     {'şanlı', 'qürurlu'}),
    (8.9, 15.3, '2020-ci il noyabrın 8-də Azərbaycan Ordusu Şuşa şəhərini işğaldan azad edərək '
                'xalqımıza böyük Zəfər sevincini yaşatdı.', {'Şuşa', 'Zəfər', 'azad'}),
    (15.5, 20.5, 'Bu tarixi qələbə xalqımızın birliyinin, ordumuzun qəhrəmanlığının və Vətən '
                 'sevgisinin təntənəsidir.', {'birliyinin,', 'qəhrəmanlığının', 'Vətən'}),
    (20.7, 24.8, 'Bu Zəfər uğrunda canından keçən şəhidlərimizi dərin hörmət və ehtiramla yad edirik.',
     {'şəhidlərimizi', 'Zəfər'}),
]
F_CAP = font(SANS, 46)
CAP_MAXW = 600
CAP_LINE_H = 58

def layout_caption(text, emph):
    words = text.split(' ')
    lines, cur, curw = [], [], 0
    space = F_CAP.getlength(' ')
    for wd in words:
        wl = F_CAP.getlength(wd)
        if cur and curw + space + wl > CAP_MAXW:
            lines.append((cur, curw)); cur, curw = [], 0
        cur.append((wd, wl)); curw += (space if len(cur) > 1 else 0) + wl
    lines.append((cur, curw))
    items = []
    for li, (ws, lw) in enumerate(lines):
        x = (W - lw) / 2
        for wd, wl in ws:
            col = GOLD if wd.strip('!.,') in {e.strip('!.,') for e in emph} else WHITE
            glow = (255, 180, 40, 110) if col == GOLD else None
            spr, pad = text_sprite(wd, F_CAP, col + (255,), glow=glow, glow_r=8)
            items.append((spr, pad, x, li))
            x += wl + space
    return items, len(lines)

CAP_LAYOUTS = [layout_caption(c[2], c[3]) for c in CAPTIONS]

# Small badge shown with caption 2
F_BADGE = font(SANS, 30)
SPR_BADGE, _ = text_sprite('ŞUŞA  •  08.11.2020', F_BADGE, WHITE + (255,), shadow=False)

# Finale
F_FIN1 = font(SERIF, 84)
F_FIN2 = font(SERIF, 96)
SPR_YAS, _ = text_sprite('Yaşasın', F_FIN1, WHITE + (255,), glow=(255, 255, 255, 90), glow_r=14)
SPR_AZ, _ = text_sprite('Azərbaycan!', F_FIN2, GOLD + (255,), glow=(255, 175, 30, 170), glow_r=20)
F_SUB = font(SANS, 36)
SPR_SUB, _ = text_sprite('Şəhidlərimizin ruhu şad olsun', F_SUB, (235, 235, 235, 255))

# Particles (golden embers)
random.seed(8112020)
PARTS = [dict(x=random.uniform(0, W), y0=random.uniform(0, H), sp=random.uniform(25, 70),
              r=random.uniform(1.2, 3.4), ph=random.uniform(0, 6.28), a=random.uniform(0.35, 0.9))
         for _ in range(55)]

def draw_particles(cv, t, boost=1.0):
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for p in PARTS:
        y = (p['y0'] - p['sp'] * t * boost) % (H + 40) - 20
        x = p['x'] + 18 * math.sin(t * 0.9 + p['ph'])
        tw = 0.6 + 0.4 * math.sin(t * 4 + p['ph'] * 3)
        a = int(255 * p['a'] * tw * min(1, boost))
        r = p['r']
        d.ellipse([x - r * 2.2, y - r * 2.2, x + r * 2.2, y + r * 2.2], fill=(255, 170, 40, a // 4))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 225, 140, a))
    cv.alpha_composite(layer)

def tricolor_bar(d, x0, y, length, thick):
    seg = length / 3
    for i, c in enumerate((BLUE, RED, GREEN)):
        d.rectangle([x0 + i * seg, y, x0 + (i + 1) * seg, y + thick], fill=c + (255,))

# ---------------------------------------------------------------- per-frame
def draw_intro_and_header(cv, t):
    d = ImageDraw.Draw(cv)
    # phase: 0..3.4 centered big; 3.4..4.2 morph to header
    if t < 4.2:
        k_out = ease_in_out((t - 3.3) / 0.8)
        a_intro = 1 - k_out
        cy = 560
        # "8"
        k8 = back_out((t - 0.25) / 0.7)
        if a_intro > 0 and t > 0.25:
            paste(cv, SPR_8, W / 2, cy - 150 - 120 * k_out, a=min(1, (t - 0.25) / 0.3) * a_intro,
                  scale=(0.4 + 0.6 * k8) * (1 - 0.4 * k_out), center=True)
        # NOYABR (tracking in)
        kn = ease_out((t - 0.7) / 0.8)
        if a_intro > 0 and t > 0.7:
            paste(cv, SPR_NOY, W / 2, cy + 20 - 120 * k_out, a=kn * a_intro, scale=1.25 - 0.25 * kn,
                  center=True)
        # tricolor line expanding
        kl = ease_out((t - 1.2) / 0.7)
        if kl > 0 and a_intro > 0:
            L = 420 * kl
            ly = cy + 85 - 120 * k_out
            bar = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            tricolor_bar(ImageDraw.Draw(bar), W / 2 - L / 2, ly, L, 6)
            paste(cv, bar, 0, 0, a=a_intro)
        # ZƏFƏR GÜNÜ letter by letter
        total_w = sum(l[2] for l in ZAFER_LETTERS)
        x = W / 2 - total_w / 2
        for i, (ch, spr, lw) in enumerate(ZAFER_LETTERS):
            st = 1.5 + i * 0.08
            k = back_out((t - st) / 0.45)
            if spr is not None and t > st and a_intro > 0:
                paste(cv, spr, x + lw / 2, cy + 160 + (1 - k) * 40 - 120 * k_out,
                      a=min(1, (t - st) / 0.25) * a_intro, scale=0.6 + 0.4 * k, center=True)
            x += lw
    # header (fades in while intro fades out)
    kh = ease_out((t - 3.5) / 0.8)
    if kh > 0:
        fin = 1 - ease_in_out((t - 24.6) / 0.6)
        a = kh * fin
        if a > 0:
            y0 = 70 - (1 - kh) * 30
            paste(cv, SPR_HDR, W / 2, y0, a=a, center=True)
            paste(cv, SPR_HDR2, W / 2, y0 + 50, a=a, center=True)
            L = 230 * kh
            bar = Image.new('RGBA', (W, 12), (0, 0, 0, 0))
            tricolor_bar(ImageDraw.Draw(bar), W / 2 - L / 2, 2, L, 4)
            paste(cv, bar, 0, y0 + 92, a=a)

def draw_captions(cv, t):
    for (st, en, _, _), (items, nlines) in zip(CAPTIONS, CAP_LAYOUTS):
        if t < st - 0.1 or t > en + 0.6:
            continue
        block_h = nlines * CAP_LINE_H
        base_y = 1150 - block_h
        out_k = ease_in_out((t - en) / 0.5)
        n = len(items)
        reveal = min(1.6, (en - st) * 0.35)
        # accent bar on the left
        kb = ease_out((t - st) / 0.5) * (1 - out_k)
        if kb > 0:
            bar = Image.new('RGBA', (8, int(block_h + 20)), (0, 0, 0, 0))
            seg = (block_h + 20) * kb / 3
            bd = ImageDraw.Draw(bar)
            for i, c in enumerate((BLUE, RED, GREEN)):
                bd.rectangle([0, i * seg, 6, (i + 1) * seg], fill=c + (255,))
            paste(cv, bar, 32, base_y - 10, a=1)
        for i, (spr, pad, x, li) in enumerate(items):
            ws = st + reveal * i / max(1, n - 1)
            k = ease_out((t - ws) / 0.45)
            if k <= 0:
                continue
            a = k * (1 - out_k)
            y = base_y + li * CAP_LINE_H + (1 - k) * 22 - out_k * 30
            paste(cv, spr, x - pad, y - pad, a=a)

def draw_badge(cv, t):
    st, en = 9.3, 15.2
    k = ease_out((t - st) / 0.6) * (1 - ease_in_out((t - en) / 0.5))
    if k <= 0:
        return
    bw, bh = SPR_BADGE.size[0] + 20, 52
    b = Image.new('RGBA', (bw + FLAG_SMALL.size[0], bh), (0, 0, 0, 0))
    bd = ImageDraw.Draw(b)
    bd.rounded_rectangle([0, 0, b.size[0] - 1, bh - 1], radius=26, fill=(15, 20, 30, 170),
                         outline=GOLD + (220,), width=2)
    b.alpha_composite(FLAG_SMALL.resize((54, 27)), (22, 12))
    b.alpha_composite(SPR_BADGE, (70, (bh - SPR_BADGE.size[1]) // 2))
    paste(cv, b, W / 2 + (1 - k) * 80, 205, a=k, center=True)

def draw_finale(cv, t):
    st = 25.0
    if t < st - 0.2:
        return
    lt = t - st
    # radial golden glow
    kg = ease_out(lt / 1.2)
    if kg > 0:
        glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        for r, a in ((420, 22), (300, 30), (190, 40)):
            gd.ellipse([W / 2 - r, 600 - r, W / 2 + r, 600 + r], fill=(255, 190, 70, int(a * kg)))
        cv.alpha_composite(glow.filter(ImageFilter.GaussianBlur(60)))
        # darken for focus
        dk = Image.new('RGBA', (W, H), (0, 0, 0, int(140 * kg)))
        cv.alpha_composite(dk)
    # flag
    kf = back_out(lt / 0.8)
    if lt > 0:
        fl = wave_flag(FLAG, t)
        paste(cv, fl, W / 2, 400, a=min(1, lt / 0.4), scale=0.5 + 0.5 * kf, center=True)
    ky = back_out((lt - 0.4) / 0.6)
    if lt > 0.4:
        paste(cv, SPR_YAS, W / 2, 590 + (1 - ky) * 40, a=min(1, (lt - 0.4) / 0.3), center=True)
    ka = back_out((lt - 0.8) / 0.7)
    if lt > 0.8:
        pulse = 1 + 0.025 * math.sin((lt - 0.8) * 4)
        paste(cv, SPR_AZ, W / 2, 700, a=min(1, (lt - 0.8) / 0.3), scale=(0.6 + 0.4 * ka) * pulse,
              center=True)
    kl = ease_out((lt - 1.4) / 0.7)
    if kl > 0:
        L = 460 * kl
        bar = Image.new('RGBA', (W, 10), (0, 0, 0, 0))
        tricolor_bar(ImageDraw.Draw(bar), W / 2 - L / 2, 2, L, 5)
        paste(cv, bar, 0, 775)
    ks = ease_out((lt - 1.8) / 0.8)
    if ks > 0:
        paste(cv, SPR_SUB, W / 2, 830 + (1 - ks) * 15, a=ks, center=True)

def draw_progress(cv, t):
    k = t / (TOTAL / FPS)
    d = ImageDraw.Draw(cv)
    L = W * k
    seg = W / 3
    for i, c in enumerate((BLUE, RED, GREEN)):
        x0, x1 = i * seg, min((i + 1) * seg, L)
        if x1 > x0:
            d.rectangle([x0, H - 6, x1, H], fill=c + (230,))

def light_sweep(cv, t, at, dur=0.9, strength=70):
    k = (t - at) / dur
    if not 0 <= k <= 1:
        return
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx = -300 + k * (W + 600)
    d.polygon([(cx - 60, 0), (cx + 60, 0), (cx - 240, H), (cx - 360, H)],
              fill=(255, 245, 220, int(strength * math.sin(k * math.pi))))
    cv.alpha_composite(layer.filter(ImageFilter.GaussianBlur(30)))

def render(frame_rgb, i):
    t = i / FPS
    cv = Image.fromarray(frame_rgb, 'RGB').convert('RGBA')
    cv.alpha_composite(VIGNETTE)
    cv.alpha_composite(GRAD)
    # dark backdrop during intro so the title pops
    ki = 1 - ease_in_out((t - 3.0) / 1.0)
    if ki > 0:
        cv.alpha_composite(Image.new('RGBA', (W, H), (0, 0, 0, int(110 * ki))))
    draw_particles(cv, t, boost=1.6 if t > 25 else 1.0)
    draw_intro_and_header(cv, t)
    draw_badge(cv, t)
    draw_captions(cv, t)
    draw_finale(cv, t)
    light_sweep(cv, t, 1.3)
    light_sweep(cv, t, 26.0)
    draw_progress(cv, t)
    # fade from white (flash) at start, fade to black at end
    if t < 0.6:
        cv.alpha_composite(Image.new('RGBA', (W, H), (255, 255, 255, int(255 * (1 - t / 0.6)))))
    end_k = (t - (TOTAL / FPS - 0.9)) / 0.9
    if end_k > 0:
        cv.alpha_composite(Image.new('RGBA', (W, H), (0, 0, 0, int(255 * clamp(end_k)))))
    return cv.convert('RGB')

def main():
    only = [int(a) for a in sys.argv[1:]]
    if only:  # preview mode: render selected frame indices from stdin stream
        pass
    fsz = W * H * 3
    i = 0
    src = sys.stdin.buffer
    dst = sys.stdout.buffer
    while True:
        buf = src.read(fsz)
        if len(buf) < fsz:
            break
        if only and i not in only:
            i += 1; continue
        fr = np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3)
        out = render(fr, i)
        if only:
            out.save(f'prev_{i:04d}.jpg', quality=88)
        else:
            dst.write(out.tobytes())
        i += 1
        if i % 60 == 0:
            print(f'frame {i}', file=sys.stderr)

if __name__ == '__main__':
    main()
