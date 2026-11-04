import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig, Img} from 'remotion';
import {C, display, ease, easeInOut, mono} from './theme';
import {CheckRow, Kicker, MediaCard, Pill, RiseWords, RoundLogo, ScriptText, StageBg, Stars, prog} from './components';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* Hook title (reference 1): spaced mono kicker + huge stacked words, one in purple. */
export const HookTitle: React.FC<{kicker: string; text: string; highlight: string[]; bg?: {src: string; start: number}}> = ({kicker, text, highlight, bg}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <StageBg />
      {bg && (
        <AbsoluteFill style={{opacity: 0.32, filter: 'blur(4px) grayscale(0.3)'}}>
          <OffthreadVideo src={staticFile(`v/${bg.src}`)} startFrom={Math.round(bg.start * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(7,5,12,0.9) 0%, rgba(7,5,12,0.35) 100%)'}} />
      <AbsoluteFill style={{padding: '0 120px', justifyContent: 'center', transform: `scale(${1 + f * 0.0004})`, transformOrigin: 'left center'}}>
        <Kicker text={kicker} delay={4} size={32} />
        <div style={{height: 26}} />
        <RiseWords text={text} highlight={highlight} size={190} delay={10} stagger={6} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Agenda (reference 6): "In this video" + script line + numbered pills over a glowing horizon. */
const icons: Record<string, string> = {
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4',
  bolt: 'M13 3L5 13h6l-1 8 8-10h-6z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  gear: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M9 20h6',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  car: 'M4 15l2-6h12l2 6v4H4zM7 19v1M17 19v1M7 15h.01M17 15h.01',
};

export const Agenda: React.FC<{items: {text: string; icon: string}[]; title?: string; sub?: string; step?: number}> = ({items, title = 'In this video', sub = 'step by step', step = 26}) => {
  const f = useCurrentFrame();
  const active = Math.min(items.length - 1, Math.max(0, Math.floor((f - 30) / step)));
  return (
    <AbsoluteFill>
      <StageBg shafts={false} horizon />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 50}}>
        <RiseWords text={title} size={120} align="center" />
        <div style={{marginTop: -6}}>
          <ScriptText text={sub} delay={14} size={64} />
        </div>
        <div style={{marginTop: 34, display: 'flex', flexDirection: 'column', gap: 20}}>
          {items.map((it, i) => {
            const d = 30 + i * step;
            const p = prog(f, d, 22);
            const on = i === active && f > d;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 30, opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: '50%',
                    border: `2px solid ${on ? 'transparent' : 'rgba(255,255,255,0.85)'}`,
                    background: on ? `radial-gradient(circle at 35% 30%, #c084fc, #6d28d9)` : 'transparent',
                    boxShadow: on ? `0 0 40px ${C.glow}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: display,
                    fontWeight: 800,
                    fontSize: 36,
                    color: '#fff',
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 22,
                    padding: '14px 40px 14px 14px',
                    borderRadius: 999,
                    background: '#fff',
                    boxShadow: on ? `0 0 0 3px ${C.violet}, 0 0 50px ${C.glow}` : '0 10px 30px rgba(0,0,0,0.4)',
                    transform: `scale(${on ? 1.04 : 1})`,
                  }}
                >
                  <div style={{width: 66, height: 66, borderRadius: '50%', background: `linear-gradient(135deg, ${C.violet}, #5b21b6)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg width="34" height="34" viewBox="0 0 24 24">
                      <path d={icons[it.icon] ?? icons.car} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{fontFamily: display, fontWeight: 800, fontSize: 46, color: '#140b24', whiteSpace: 'nowrap'}}>{it.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Logo sting: round logo, channel name, thin purple line. */
export const LogoSting: React.FC<{subtitle?: string}> = ({subtitle = 'Automotive Origins'}) => {
  const f = useCurrentFrame();
  const line = prog(f, 26, 30);
  return (
    <AbsoluteFill>
      <StageBg shafts intensity={0.6} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <RoundLogo size={420} delay={2} />
        <div style={{height: 70}} />
        <RiseWords text="AUTO GENESIS" size={92} align="center" delay={20} stagger={3} />
        <div style={{width: 520 * line, height: 2, background: `linear-gradient(90deg, rgba(0,0,0,0), ${C.violet}, rgba(0,0,0,0))`, margin: '18px 0'}} />
        <Kicker text={subtitle} delay={34} size={24} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Chapter card: number in a ring + title, laid over dimmed footage. */
export const Chapter: React.FC<{n: number; title: string; sub?: string; bg?: {src: string; start: number}; photo?: string}> = ({n, title, sub, bg, photo}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ring = prog(f, 0, 40);
  return (
    <AbsoluteFill>
      <StageBg intensity={0.7} />
      {(bg || photo) && (
        <AbsoluteFill style={{opacity: 0.35, transform: `scale(${1.1 + f * 0.0008})`, filter: 'blur(3px) saturate(0.7)'}}>
          {bg && <OffthreadVideo src={staticFile(`v/${bg.src}`)} startFrom={Math.round(bg.start * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
          {photo && <Img src={staticFile(`p/${photo}`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 30% 50%, rgba(7,5,12,0.5) 0%, rgba(7,5,12,0.92) 75%)'}} />
      <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '0 150px', gap: 70}}>
        <div style={{position: 'relative', width: 260, height: 260, flexShrink: 0}}>
          <svg width="260" height="260" style={{position: 'absolute', transform: 'rotate(-90deg)'}}>
            <circle cx="130" cy="130" r="122" fill="none" stroke={C.line} strokeWidth="2" />
            <circle cx="130" cy="130" r="122" fill="none" stroke={C.violet} strokeWidth="6" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - ring * 100} style={{filter: `drop-shadow(0 0 12px ${C.violet})`}} />
          </svg>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 900, fontSize: 120, color: C.ink, opacity: prog(f, 8, 20)}}>
            {String(n).padStart(2, '0')}
          </div>
        </div>
        <div>
          <Kicker text={sub ?? 'Chapter'} delay={8} />
          <div style={{height: 18}} />
          <RiseWords text={title} size={112} delay={12} stagger={5} maxWidth={1300} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Big stat: animated counter inside a progress ring. */
export const Stat: React.FC<{value: number; suffix?: string; prefix?: string; label: string; sub?: string; decimals?: number; ringPct?: number}> = ({
  value,
  suffix = '',
  prefix = '',
  label,
  sub,
  decimals = 0,
  ringPct = 0.8,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, 6, 45, easeInOut);
  const v = (value * p).toFixed(decimals);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 50}}>
      <div style={{position: 'relative', width: 340, height: 340}}>
        <svg width="340" height="340" style={{position: 'absolute', transform: 'rotate(-90deg)'}}>
          <circle cx="170" cy="170" r="150" fill="rgba(20,14,36,0.6)" stroke={C.line} strokeWidth="14" />
          <circle cx="170" cy="170" r="150" fill="none" stroke="url(#sg)" strokeWidth="14" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - p * ringPct * 100} />
          <defs>
            <linearGradient id="sg">
              <stop offset="0" stopColor="#e9d5ff" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
          <div style={{fontFamily: display, fontWeight: 900, fontSize: 104, color: C.ink, lineHeight: 1}}>
            {prefix}
            {v}
          </div>
          <div style={{fontFamily: display, fontWeight: 700, fontSize: 34, color: C.lilac}}>{suffix}</div>
        </div>
      </div>
      <div style={{opacity: prog(f, 14, 20), transform: `translateX(${(1 - prog(f, 14, 20)) * 30}px)`}}>
        <div style={{fontFamily: display, fontWeight: 800, fontSize: 58, color: C.ink, maxWidth: 640, lineHeight: 1.1}}>{label}</div>
        {sub && <div style={{fontFamily: display, fontWeight: 600, fontSize: 32, color: C.dim, marginTop: 12, maxWidth: 640}}>{sub}</div>}
      </div>
    </div>
  );
};

/* Stat overlay panel placed over footage, dark glass on the left third. */
export const StatPanel: React.FC<React.ComponentProps<typeof Stat> & {dur: number}> = ({dur, ...props}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pin = prog(f, 0, 20);
  const pout = prog(f, dur * fps - 15, 15, easeInOut);
  return (
    <AbsoluteFill style={{opacity: pin * (1 - pout)}}>
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(7,5,12,0.92) 0%, rgba(7,5,12,0.75) 45%, rgba(7,5,12,0) 80%)'}} />
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 130}}>
        <Stat {...props} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Horizontal timeline with dots that light up in sequence. */
export const Timeline: React.FC<{items: {year: string; text: string}[]; title?: string; step?: number}> = ({items, title, step = 30}) => {
  const f = useCurrentFrame();
  const left = 200;
  const right = 1720;
  const gap = (right - left) / (items.length - 1);
  const lineP = prog(f, 10, step * items.length, (t) => t);
  return (
    <AbsoluteFill>
      <StageBg intensity={0.5} />
      {title && (
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <RiseWords text={title} size={84} align="center" />
        </div>
      )}
      <div style={{position: 'absolute', left, top: 560, width: right - left, height: 3, background: C.line}} />
      <div style={{position: 'absolute', left, top: 559, width: (right - left) * lineP, height: 5, background: `linear-gradient(90deg, #6d28d9, ${C.lilac})`, boxShadow: `0 0 20px ${C.violet}`, borderRadius: 4}} />
      {items.map((it, i) => {
        const d = 10 + i * step;
        const p = prog(f, d, 22);
        const x = left + gap * i;
        const up = i % 2 === 0;
        return (
          <div key={i}>
            <div
              style={{
                position: 'absolute',
                left: x - 24,
                top: 537,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: p > 0.5 ? `radial-gradient(circle at 35% 30%, #e9d5ff, ${C.violet})` : C.bg2,
                border: `3px solid ${C.violet}`,
                transform: `scale(${0.5 + 0.5 * p})`,
                boxShadow: p > 0.5 ? `0 0 30px ${C.glow}` : 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: x - 190,
                width: 380,
                top: up ? 330 : 630,
                textAlign: 'center',
                opacity: p,
                transform: `translateY(${(1 - p) * (up ? 30 : -30)}px)`,
              }}
            >
              <div style={{fontFamily: display, fontWeight: 900, fontSize: 74, color: C.ink}}>{it.year}</div>
              <div style={{fontFamily: display, fontWeight: 600, fontSize: 30, color: C.dim, lineHeight: 1.25}}>{it.text}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* Two floating media cards with labels — comparison layout (reference 3). */
export const CardPair: React.FC<{a: React.ComponentProps<typeof MediaCard>; b: React.ComponentProps<typeof MediaCard>; title?: string; highlight?: string[]}> = ({a, b, title, highlight}) => (
  <AbsoluteFill>
    <StageBg intensity={0.6} />
    {title && (
      <div style={{position: 'absolute', top: 70, left: 0, right: 0}}>
        <RiseWords text={title} size={70} align="center" highlight={highlight} />
      </div>
    )}
    <MediaCard {...a} />
    <MediaCard {...b} />
  </AbsoluteFill>
);

/* Checklist scene over blurred footage (reference 4). */
// `at` / `arrowAt` (frames) let rows land on the exact words in the narration.
export const Checklist: React.FC<{rows: {text: string; tag?: string}[]; arrow?: string; bg?: {src: string; start: number}; photo?: string; step?: number; at?: number[]; arrowAt?: number}> = ({
  rows,
  arrow,
  bg,
  photo,
  step = 18,
  at,
  arrowAt,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ap = prog(f, arrowAt ?? 20 + rows.length * step, 26);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{filter: 'blur(10px) brightness(0.5)', transform: 'scale(1.08)'}}>
        {bg && <OffthreadVideo src={staticFile(`v/${bg.src}`)} startFrom={Math.round(bg.start * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
        {photo && <Img src={staticFile(`p/${photo}`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(7,5,12,0.85), rgba(46,16,101,0.25))'}} />
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 140, gap: 34}}>
        {rows.map((r, i) => (
          <div key={i}>
            <CheckRow text={r.text} tag={r.tag} delay={at ? at[i] : 10 + i * step} />
          </div>
        ))}
        {arrow && (
          <div style={{display: 'flex', alignItems: 'center', gap: 34, marginTop: 30, opacity: ap, transform: `translateX(${(1 - ap) * -40}px)`}}>
            <svg width="150" height="40" viewBox="0 0 150 40">
              <path d="M4 20h136M120 6l16 14-16 14" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{fontFamily: display, fontWeight: 900, fontSize: 92, color: C.violet, textShadow: `0 0 40px ${C.glow}`}}>{arrow}</span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Spec sheet: rows of label / value that fill in like a data card. */
export const SpecCard: React.FC<{title: string; rows: [string, string][]; photo?: string}> = ({title, rows, photo}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <StageBg intensity={0.5} />
      {photo && <MediaCard photo={photo} x={1010} y={190} w={800} h={700} delay={4} tilt={1.5} />}
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 130}}>
        <Kicker text="Specifications" delay={2} />
        <div style={{height: 14}} />
        <RiseWords text={title} size={80} delay={6} />
        <div style={{height: 30}} />
        {rows.map(([k, v], i) => {
          const p = prog(f, 20 + i * 10, 18);
          return (
            <div key={i} style={{display: 'flex', justifyContent: 'space-between', width: 780, padding: '18px 0', borderBottom: `1px solid ${C.line}`, opacity: p, transform: `translateX(${(1 - p) * -30}px)`}}>
              <span style={{fontFamily: display, fontWeight: 600, fontSize: 34, color: C.dim}}>{k}</span>
              <span style={{fontFamily: display, fontWeight: 800, fontSize: 36, color: C.ink}}>{v}</span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Quote / key line, centered with circle accents. */
export const KeyLine: React.FC<{text: string; highlight?: string[]; kicker?: string}> = ({text, highlight, kicker}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <StageBg />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'absolute', width: 760, height: 760, borderRadius: '50%', border: `1px solid ${C.line}`, transform: `scale(${0.9 + 0.1 * prog(f, 0, 60)}) rotate(${f * 0.2}deg)`}} />
        <div style={{position: 'absolute', width: 980, height: 980, borderRadius: '50%', border: `1px dashed rgba(196,181,253,0.12)`, transform: `rotate(${-f * 0.15}deg)`}} />
        {kicker && <Kicker text={kicker} delay={0} />}
        <div style={{height: 24}} />
        <RiseWords text={text} highlight={highlight} size={104} align="center" delay={6} stagger={4} maxWidth={1500} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Outro: logo + subscribe chip. */
export const Outro: React.FC<{line?: string}> = ({line = 'Thanks for watching'}) => {
  const f = useCurrentFrame();
  const sp = prog(f, 40, 20);
  return (
    <AbsoluteFill>
      <StageBg shafts={false} horizon />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 120}}>
        <RoundLogo size={330} delay={0} />
        <div style={{height: 60}} />
        <RiseWords text={line} size={72} align="center" delay={12} stagger={3} />
        <div style={{height: 40}} />
        <div style={{opacity: sp, transform: `scale(${0.85 + 0.15 * sp})`, display: 'flex', gap: 24}}>
          <Pill text="Subscribe" size={38} />
          <Pill text="Like  ·  Share" solid={false} size={38} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export {Stars};
