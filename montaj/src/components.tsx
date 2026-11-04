import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, display, ease, easeInOut, mono, script} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const prog = (f: number, start: number, len: number, e = ease) =>
  interpolate(f, [start, start + len], [0, 1], {...clamp, easing: e});

/* ---------- Backgrounds ---------- */

// Dark stage with drifting vertical light shafts (intro reference) and a purple horizon glow.
export const StageBg: React.FC<{shafts?: boolean; horizon?: boolean; intensity?: number}> = ({
  shafts = true,
  horizon = false,
  intensity = 1,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 90% at 50% 10%, ${C.bg2} 0%, ${C.bg} 60%)`}}>
      {shafts &&
        new Array(14).fill(0).map((_, i) => {
          const x = (i / 14) * 2100 - 90 + Math.sin(f / 90 + i) * 18;
          const w = 30 + random(`w${i}`) * 70;
          const a = (0.1 + random(`a${i}`) * 0.16) * (0.75 + 0.25 * Math.sin(f / 40 + i * 1.7)) * intensity;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: 0,
                width: w,
                height: '100%',
                background: `linear-gradient(180deg, rgba(139,92,246,0) 0%, rgba(139,92,246,${a}) 45%, rgba(88,28,135,${a * 0.6}) 80%, rgba(0,0,0,0) 100%)`,
                filter: 'blur(14px)',
              }}
            />
          );
        })}
      {horizon && <Horizon />}
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};

// Glowing planet-edge arc at the bottom of the frame (agenda reference).
export const Horizon: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 0.85 + 0.15 * Math.sin(f / 25);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: -600,
          right: -600,
          top: 900,
          height: 2400,
          borderRadius: '50%',
          background: 'radial-gradient(60% 18% at 50% 0%, rgba(124,58,237,0.35) 0%, rgba(7,5,12,0) 100%), #07050c',
          boxShadow: `0 -2px 0 rgba(196,181,253,${0.9 * pulse}), 0 -10px 40px rgba(139,92,246,${0.75 * pulse}), 0 -40px 140px rgba(124,58,237,${0.5 * pulse})`,
        }}
      />
      <Stars />
    </AbsoluteFill>
  );
};

export const Stars: React.FC<{n?: number}> = ({n = 70}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {new Array(n).fill(0).map((_, i) => {
        const x = random(`sx${i}`) * 1920;
        const y = random(`sy${i}`) * 820;
        const s = 1 + random(`ss${i}`) * 2;
        const o = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(f / (20 + random(`sp${i}`) * 30) + i));
        return <div key={i} style={{position: 'absolute', left: x, top: y - f * 0.08, width: s, height: s, borderRadius: 9, background: '#e9d5ff', opacity: o}} />;
      })}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: 'none'}} />
);

// Lightweight film grain: a few hundred pseudo-random dots, re-seeded every 2 frames.
export const Grain: React.FC = () => {
  const f = Math.floor(useCurrentFrame() / 2);
  return (
    <AbsoluteFill style={{opacity: 0.05, mixBlendMode: 'screen'}}>
      {new Array(160).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: random(`g${f}-${i}`) * 1920,
            top: random(`h${f}-${i}`) * 1080,
            width: 2,
            height: 2,
            background: '#fff',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* ---------- Footage ---------- */

// Subtle purple/black grade that ties mismatched sources together.
export const Grade: React.FC = () => (
  <>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(46,16,101,0.18) 0%, rgba(7,5,12,0) 40%, rgba(7,5,12,0.45) 100%)'}} />
    <AbsoluteFill style={{background: 'rgba(91,33,182,0.10)', mixBlendMode: 'color'}} />
    <Vignette strength={0.6} />
  </>
);

type Move = 'in' | 'out' | 'left' | 'right' | 'up';

const moveTransform = (move: Move, p: number, amount = 0.08) => {
  switch (move) {
    case 'in':
      return `scale(${1.04 + amount * p})`;
    case 'out':
      return `scale(${1.04 + amount * (1 - p)})`;
    case 'left':
      return `scale(1.1) translateX(${interpolate(p, [0, 1], [30, -30])}px)`;
    case 'right':
      return `scale(1.1) translateX(${interpolate(p, [0, 1], [-30, 30])}px)`;
    case 'up':
      return `scale(1.1) translateY(${interpolate(p, [0, 1], [20, -20])}px)`;
  }
};

export const VideoShot: React.FC<{src: string; start: number; dur: number; move?: Move; flip?: boolean; rate?: number}> = ({
  src,
  start,
  dur,
  move = 'in',
  flip,
  rate = 1,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = f / (dur * fps);
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `${moveTransform(move, p, 0.06)} ${flip ? 'scaleX(-1)' : ''}`}}>
        <OffthreadVideo
          src={staticFile(`v/${src}`)}
          startFrom={Math.round(start * fps)}
          playbackRate={rate}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
      <Grade />
    </AbsoluteFill>
  );
};

// Photos rarely match 16:9: blurred fill behind, sharp image with slow Ken Burns on top.
export const PhotoShot: React.FC<{src: string; dur: number; move?: Move; fit?: 'cover' | 'contain'}> = ({src, dur, move = 'in', fit = 'cover'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = f / (dur * fps);
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: 'scale(1.2)', filter: 'blur(40px) brightness(0.45) saturate(1.2)'}}>
        <Img src={staticFile(`p/${src}`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: moveTransform(move, p, 0.1)}}>
        <Img src={staticFile(`p/${src}`)} style={{width: '100%', height: '100%', objectFit: fit}} />
      </AbsoluteFill>
      <Grade />
    </AbsoluteFill>
  );
};

/* ---------- Floating media card (reference 3 / 5) ---------- */

export const MediaCard: React.FC<{
  label?: string;
  photo?: string;
  video?: {src: string; start: number};
  x: number;
  y: number;
  w: number;
  h: number;
  delay?: number;
  tilt?: number;
}> = ({label, photo, video, x, y, w, h, delay = 0, tilt = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = prog(f, delay, 22);
  const float = Math.sin((f - delay) / 45) * 6;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        opacity: p,
        transform: `translateY(${(1 - p) * 60 + float}px) scale(${0.94 + 0.06 * p}) rotate(${tilt * p}deg)`,
        filter: `blur(${(1 - p) * 10}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 36,
          overflow: 'hidden',
          border: `1.5px solid ${C.line}`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.65), 0 0 60px rgba(139,92,246,0.25)`,
          background: C.bg2,
        }}
      >
        {photo && <Img src={staticFile(`p/${photo}`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.05 + 0.05 * prog(f, delay, 200, easeInOut)})`}} />}
        {video && (
          <OffthreadVideo src={staticFile(`v/${video.src}`)} startFrom={Math.round(video.start * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        )}
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(7,5,12,0.55) 100%)'}} />
      </div>
      {label && (
        <div style={{position: 'absolute', top: -30, left: '50%', transform: `translateX(-50%) scale(${0.8 + 0.2 * prog(f, delay + 10, 16)})`}}>
          <Pill text={label} />
        </div>
      )}
    </div>
  );
};

export const Pill: React.FC<{text: string; solid?: boolean; size?: number}> = ({text, solid = true, size = 30}) => (
  <div
    style={{
      fontFamily: display,
      fontWeight: 700,
      fontSize: size,
      color: '#fff',
      padding: `${size * 0.35}px ${size * 0.8}px`,
      borderRadius: 999,
      whiteSpace: 'nowrap',
      background: solid ? `linear-gradient(135deg, ${C.violet}, #6d28d9)` : C.glass,
      border: solid ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${C.line}`,
      boxShadow: solid ? `0 10px 30px rgba(124,58,237,0.5)` : 'none',
      backdropFilter: 'blur(12px)',
    }}
  >
    {text}
  </div>
);

/* ---------- Text ---------- */

// Word-by-word rise with blur, used for every headline so motion stays consistent.
export const RiseWords: React.FC<{
  text: string;
  highlight?: string[];
  size: number;
  delay?: number;
  stagger?: number;
  weight?: number;
  color?: string;
  align?: 'left' | 'center';
  lineHeight?: number;
  maxWidth?: number;
}> = ({text, highlight = [], size, delay = 0, stagger = 4, weight = 900, color = C.ink, align = 'left', lineHeight = 1.02, maxWidth}) => {
  const f = useCurrentFrame();
  const lines = text.split('\n');
  let k = 0;
  return (
    <div style={{fontFamily: display, fontWeight: weight, fontSize: size, lineHeight, color, textAlign: align, maxWidth, letterSpacing: -size * 0.015}}>
      {lines.map((line, li) => (
        <div key={li} style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.26}}>
          {line.split(' ').map((w, wi) => {
            const p = prog(f, delay + k++ * stagger, 20);
            const hl = highlight.includes(w.replace(/[?!.,:]/g, ''));
            return (
              <span key={wi} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.06}}>
                <span
                  style={{
                    display: 'inline-block',
                    transform: `translateY(${(1 - p) * size * 0.7}px)`,
                    opacity: p,
                    filter: `blur(${(1 - p) * 8}px)`,
                    color: hl ? C.violet : undefined,
                    textShadow: hl ? `0 0 40px ${C.glow}` : undefined,
                  }}
                >
                  {w}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Kicker: React.FC<{text: string; delay?: number; size?: number; color?: string}> = ({text, delay = 0, size = 26, color = C.lilac}) => {
  const f = useCurrentFrame();
  const p = prog(f, delay, 24);
  return (
    <div style={{fontFamily: mono, fontWeight: 700, fontSize: size, letterSpacing: size * 0.55, color, opacity: p, transform: `translateX(${(1 - p) * -30}px)`, textTransform: 'uppercase'}}>
      {text}
    </div>
  );
};

export const ScriptText: React.FC<{text: string; delay?: number; size?: number}> = ({text, delay = 0, size = 60}) => {
  const f = useCurrentFrame();
  const p = prog(f, delay, 30);
  return (
    <div
      style={{
        fontFamily: script,
        fontWeight: 700,
        fontSize: size,
        color: C.violet,
        textShadow: `0 0 30px ${C.glow}`,
        clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
      }}
    >
      {text}
    </div>
  );
};

/* ---------- Logo ---------- */

// Round logo with orbiting purple arcs — the circle motif is reused throughout the edit.
export const RoundLogo: React.FC<{size: number; delay?: number; spin?: boolean}> = ({size, delay = 0, spin = true}) => {
  const f = useCurrentFrame();
  const p = prog(f, delay, 30);
  const rot = spin ? (f - delay) * 0.6 : 0;
  const ring = (inset: number, dash: string, dir: number, w: number, o: number) => (
    <svg width={size + inset * 2} height={size + inset * 2} style={{position: 'absolute', left: -inset, top: -inset, transform: `rotate(${rot * dir}deg)`, opacity: o * p}}>
      <circle
        cx={(size + inset * 2) / 2}
        cy={(size + inset * 2) / 2}
        r={(size + inset * 2) / 2 - w}
        fill="none"
        stroke="url(#lg)"
        strokeWidth={w}
        strokeLinecap="round"
        strokeDasharray={dash}
        pathLength={100}
        strokeDashoffset={(1 - p) * 100}
      />
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
  return (
    <div style={{position: 'relative', width: size, height: size, transform: `scale(${0.85 + 0.15 * p})`, opacity: p}}>
      <div style={{position: 'absolute', inset: -size * 0.25, borderRadius: '50%', background: `radial-gradient(circle, ${C.glow} 0%, rgba(0,0,0,0) 65%)`, opacity: 0.8}} />
      {ring(size * 0.07, '62 38', 1, 3, 0.9)}
      {ring(size * 0.14, '18 12 30 40', -0.7, 2, 0.5)}
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', boxShadow: `0 0 0 3px rgba(196,181,253,0.5), 0 30px 80px rgba(0,0,0,0.6)`}}>
        <Img src={staticFile('logo.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.1)'}} />
      </div>
    </div>
  );
};

/* ---------- Lower third / keyword ---------- */

export const LowerThird: React.FC<{title: string; sub?: string; dur: number}> = ({title, sub, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pin = prog(f, 0, 22);
  const pout = prog(f, dur * fps - 18, 18, easeInOut);
  const p = pin * (1 - pout);
  return (
    <div style={{position: 'absolute', left: 110, bottom: 110, display: 'flex', alignItems: 'center', gap: 26, opacity: p, transform: `translateX(${(1 - pin) * -40 + pout * -20}px)`}}>
      <div style={{width: 64, height: 64, borderRadius: '50%', border: `3px solid ${C.violet}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${C.glow}`}}>
        <div style={{width: 22, height: 22, borderRadius: '50%', background: C.violet, transform: `scale(${0.6 + 0.4 * Math.sin(f / 12) ** 2})`}} />
      </div>
      <div style={{padding: '18px 34px', borderRadius: 999, background: C.glass, border: `1px solid ${C.line}`, backdropFilter: 'blur(16px)'}}>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 40, color: C.ink, whiteSpace: 'nowrap'}}>{title}</div>
        {sub && <div style={{fontFamily: display, fontWeight: 600, fontSize: 24, color: C.lilac, marginTop: 2, whiteSpace: 'nowrap'}}>{sub}</div>}
      </div>
    </div>
  );
};

/* ---------- Check list (reference 4) ---------- */

export const CheckRow: React.FC<{text: string; tag?: string; delay: number}> = ({text, tag, delay}) => {
  const f = useCurrentFrame();
  const p = prog(f, delay, 20);
  const c = prog(f, delay + 8, 14);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 26,
        padding: '18px 44px 18px 18px',
        borderRadius: 999,
        background: C.glass,
        border: `1px solid ${C.line}`,
        backdropFilter: 'blur(14px)',
        opacity: p,
        transform: `translateX(${(1 - p) * -60}px)`,
      }}
    >
      <div style={{width: 74, height: 74, borderRadius: '50%', background: `linear-gradient(135deg, ${C.violet}, #6d28d9)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${C.glow}`}}>
        <svg width="40" height="40" viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - c} />
        </svg>
      </div>
      <span style={{fontFamily: display, fontWeight: 700, fontSize: 52, color: C.ink}}>{text}</span>
      {tag && <span style={{fontFamily: display, fontWeight: 600, fontSize: 30, color: C.lilac}}>{tag}</span>}
    </div>
  );
};
