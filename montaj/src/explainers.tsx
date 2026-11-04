import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, display, easeInOut, mono, sec} from './theme';
import {Kicker, Pill, RiseWords, StageBg, prog} from './components';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* Centered title over footage (used on top of a VideoShot). */
export const TitleOverlay: React.FC<{text: string; highlight?: string[]; kicker?: string; size?: number}> = ({text, highlight, kicker, size = 110}) => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(7,5,12,0.75) 0%, rgba(7,5,12,0.35) 70%)'}} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      {kicker && <Kicker text={kicker} delay={2} />}
      <div style={{height: 20}} />
      <RiseWords text={text} highlight={highlight} size={size} align="center" delay={6} stagger={4} maxWidth={1600} />
    </AbsoluteFill>
  </AbsoluteFill>
);

/* Two-way choice: two rings with a "vs" between them. `pick` lights one side after a delay. */
export const Choice: React.FC<{title?: string; a: string; b: string; pick?: 'a' | 'b'; pickAt?: number; kicker?: string}> = ({title, a, b, pick, pickAt = 60, kicker}) => {
  const f = useCurrentFrame();
  const side = (label: string, i: number) => {
    const p = prog(f, 14 + i * 10, 24);
    const chosen = pick && ((pick === 'a' && i === 0) || (pick === 'b' && i === 1));
    const cp = chosen ? prog(f, pickAt, 20) : 0;
    const dim = pick && !chosen ? prog(f, pickAt, 20) : 0;
    return (
      <div style={{width: 520, height: 520, borderRadius: '50%', position: 'relative', opacity: p * (1 - dim * 0.55), transform: `scale(${(0.85 + 0.15 * p) * (1 + cp * 0.06)})`}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `3px solid ${cp > 0 ? C.violet : C.line}`,
            background: `radial-gradient(circle at 50% 35%, rgba(139,92,246,${0.12 + cp * 0.35}) 0%, rgba(14,10,24,0.85) 70%)`,
            boxShadow: cp > 0 ? `0 0 80px rgba(139,92,246,${0.6 * cp})` : 'none',
          }}
        />
        <div style={{position: 'absolute', inset: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: display, fontWeight: 800, fontSize: 56, color: C.ink, lineHeight: 1.1}}>{label}</div>
      </div>
    );
  };
  const vs = prog(f, 26, 20);
  return (
    <AbsoluteFill>
      <StageBg intensity={0.6} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 90}}>
        {kicker && <Kicker text={kicker} />}
        {title && (
          <>
            <div style={{height: 14}} />
            <RiseWords text={title} size={76} align="center" delay={4} />
          </>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 70, paddingTop: title ? 140 : 0}}>
        {side(a, 0)}
        <div style={{fontFamily: mono, fontWeight: 700, fontSize: 44, color: C.lilac, opacity: vs, transform: `scale(${0.6 + 0.4 * vs})`}}>VS</div>
        {side(b, 1)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Ranking list — winner highlighted, the rest trail behind. */
export const Ranking: React.FC<{title: string; kicker?: string; rows: string[]; photo?: string}> = ({title, kicker, rows, photo}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <StageBg intensity={0.5} />
      {photo && (
        <AbsoluteFill style={{left: 900, width: 1020, opacity: 0.9 * prog(f, 0, 30), overflow: 'hidden'}}>
          <Img src={staticFile(`p/${photo}`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.05 + f * 0.0005})`}} />
          <AbsoluteFill style={{background: `linear-gradient(90deg, ${C.bg} 0%, rgba(7,5,12,0.35) 35%, rgba(7,5,12,0.1) 100%)`}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 130}}>
        {kicker && <Kicker text={kicker} />}
        <div style={{height: 16}} />
        <RiseWords text={title} size={92} delay={4} highlight={['Year']} maxWidth={820} />
        <div style={{height: 40}} />
        {rows.map((r, i) => {
          const p = prog(f, 22 + i * 12, 22);
          const win = i === 0;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 26, marginBottom: 22, opacity: p * (win ? 1 : 0.6), transform: `translateX(${(1 - p) * -40}px)`}}>
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: display,
                  fontWeight: 900,
                  fontSize: 34,
                  color: '#fff',
                  background: win ? `radial-gradient(circle at 35% 30%, #c084fc, #6d28d9)` : 'transparent',
                  border: win ? 'none' : '2px solid rgba(255,255,255,0.5)',
                  boxShadow: win ? `0 0 40px ${C.glow}` : 'none',
                }}
              >
                {win ? 1 : 'vs'}
              </div>
              <span style={{fontFamily: display, fontWeight: win ? 900 : 700, fontSize: win ? 64 : 46, color: C.ink}}>{r}</span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Horizontal bars with values — used for trunk volume and steering ratio. */
export const Bars: React.FC<{title: string; kicker?: string; unit: string; rows: {label: string; value: number; hl?: boolean}[]; max: number}> = ({title, kicker, unit, rows, max}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <StageBg intensity={0.5} />
      <AbsoluteFill style={{justifyContent: 'center', padding: '0 170px'}}>
        {kicker && <Kicker text={kicker} />}
        <div style={{height: 16}} />
        <RiseWords text={title} size={84} delay={4} />
        <div style={{height: 60}} />
        {rows.map((r, i) => {
          const p = prog(f, 20 + i * 14, 40, easeInOut);
          return (
            <div key={i} style={{marginBottom: 40}}>
              <div style={{display: 'flex', justifyContent: 'space-between', width: 1580, fontFamily: display, fontWeight: 700, fontSize: 38, color: r.hl ? C.ink : C.dim, marginBottom: 12}}>
                <span>{r.label}</span>
                <span>
                  {(r.value * p).toFixed(Number.isInteger(r.value) ? 0 : 1)} {unit}
                </span>
              </div>
              <div style={{width: 1580, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden'}}>
                <div
                  style={{
                    width: `${(r.value / max) * 100 * p}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: r.hl ? `linear-gradient(90deg, #6d28d9, ${C.lilac})` : 'rgba(196,181,253,0.35)',
                    boxShadow: r.hl ? `0 0 30px ${C.glow}` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Selespeed explained: pump -> accumulator -> actuator -> gearbox, then the failure chain. */
export const SelespeedDiagram: React.FC<{beats: {myth: number; culprit: number; pump: number; light: number}}> = ({beats}) => {
  const f = useCurrentFrame();
  const node = (x: number, y: number, label: string, sub: string, state: 'idle' | 'hot' | 'bad' | 'myth', delay: number) => {
    const p = prog(f, delay, 22);
    const col = state === 'bad' ? '#f43f5e' : state === 'hot' ? C.violet : C.line;
    const pulse = state === 'bad' ? 0.5 + 0.5 * Math.sin(f / 4) : 1;
    return (
      <div style={{position: 'absolute', left: x - 170, top: y - 120, width: 340, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
        <div
          style={{
            width: 200,
            height: 200,
            margin: '0 auto',
            borderRadius: '50%',
            border: `4px solid ${col}`,
            background: state === 'idle' || state === 'myth' ? 'rgba(20,14,36,0.8)' : `radial-gradient(circle, ${state === 'bad' ? 'rgba(244,63,94,0.35)' : 'rgba(139,92,246,0.35)'} 0%, rgba(20,14,36,0.85) 70%)`,
            boxShadow: state === 'idle' || state === 'myth' ? 'none' : `0 0 ${60 * pulse}px ${state === 'bad' ? 'rgba(244,63,94,0.7)' : C.glow}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <span style={{fontFamily: display, fontWeight: 900, fontSize: 25, color: C.ink, padding: 8}}>{label}</span>
          {state === 'myth' && <div style={{position: 'absolute', width: 230, height: 6, background: '#f43f5e', transform: `rotate(-35deg) scaleX(${prog(f, beats.myth + 10, 14)})`, borderRadius: 4}} />}
        </div>
        <div style={{fontFamily: display, fontWeight: 600, fontSize: 28, color: C.dim, marginTop: 16}}>{sub}</div>
      </div>
    );
  };
  const xs = [330, 750, 1170, 1590];
  const y = 560;
  const flow = (f % 40) / 40;
  const failing = f > beats.pump;
  return (
    <AbsoluteFill>
      <StageBg intensity={0.5} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 90}}>
        <Kicker text="How Selespeed works" />
        <div style={{height: 14}} />
        <RiseWords text="A hydraulic robot on a manual gearbox" size={66} align="center" delay={4} highlight={['robot']} />
      </AbsoluteFill>
      {/* connecting pipe with moving pressure pulses */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <line x1={xs[0]} y1={y - 20} x2={xs[3]} y2={y - 20} stroke={C.line} strokeWidth={6} strokeDasharray={`${prog(f, 20, 40) * 1300} 2000`} />
        {!failing &&
          [0, 1, 2, 3].map((k) => {
            const px = xs[0] + ((flow + k / 4) % 1) * (xs[3] - xs[0]);
            return <circle key={k} cx={px} cy={y - 20} r={8} fill={C.lilac} opacity={prog(f, 50, 20)} />;
          })}
      </svg>
      {node(xs[0], y, 'Pump', 'electric', f > beats.pump ? 'bad' : 'idle', 16)}
      {node(xs[1], y, 'Accumulator', 'pressure store', f > beats.culprit ? (f > beats.pump ? 'bad' : 'hot') : 'idle', 24)}
      {node(xs[2], y, 'Brain', 'control unit', f > beats.myth && f < beats.culprit ? 'myth' : 'idle', 32)}
      {node(xs[3], y, 'Gearbox', 'manual + clutch', 'idle', 40)}
      {/* captions for each beat */}
      {[
        [beats.myth, beats.culprit, 'Everyone blames the brain…'],
        [beats.culprit, beats.pump, 'The real culprit: the pressure accumulator'],
        [beats.pump, beats.light, 'Gas runs out → pump never stops → burns out'],
        [beats.light, 99999, 'Red light on the dash — you’re stranded'],
      ].map(([a, b, t], i) => {
        const o = prog(f, a as number, 14) * (1 - prog(f, b as number, 10));
        return (
          <div key={i} style={{position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
            <Pill text={t as string} solid={i !== 0} size={38} />
          </div>
        );
      })}
      {f > beats.light && (
        <div
          style={{
            position: 'absolute',
            right: 120,
            top: 120,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fb7185, #be123c)',
            boxShadow: `0 0 ${50 + 30 * Math.sin(f / 5)}px rgba(244,63,94,0.8)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: display,
            fontWeight: 900,
            fontSize: 70,
            color: '#fff',
            opacity: prog(f, beats.light, 10),
          }}
        >
          !
        </div>
      )}
    </AbsoluteFill>
  );
};

/* Rivals: three MacPherson cards, then the Alfa with double wishbones. */
export const Rivals: React.FC<{alfaAt: number; carsAt?: number[]}> = ({alfaAt, carsAt}) => {
  const f = useCurrentFrame();
  const cars = ['Opel Vectra B', 'VW Passat B5', 'Ford Mondeo'];
  const ap = prog(f, alfaAt, 26);
  return (
    <AbsoluteFill>
      <StageBg intensity={0.5} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 100}}>
        <Kicker text="The rivals" />
        <div style={{height: 14}} />
        <RiseWords text="Who were the rivals?" size={84} align="center" delay={4} />
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 400, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40}}>
        {cars.map((c, i) => {
          const p = prog(f, carsAt ? carsAt[i] : 30 + i * 22, 22);
          return (
            <div
              key={i}
              style={{
                width: 380,
                padding: '50px 20px',
                borderRadius: 40,
                background: C.glass,
                border: `1px solid ${C.line}`,
                textAlign: 'center',
                opacity: p * (1 - ap * 0.5),
                transform: `translateY(${(1 - p) * 40}px) scale(${1 - ap * 0.06})`,
              }}
            >
              <div style={{fontFamily: display, fontWeight: 800, fontSize: 44, color: C.ink}}>{c}</div>
              <div style={{marginTop: 22, display: 'inline-block', padding: '10px 26px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', fontFamily: display, fontWeight: 600, fontSize: 28, color: C.dim}}>
                MacPherson struts
              </div>
            </div>
          );
        })}
        <div
          style={{
            width: 420,
            padding: '50px 20px',
            borderRadius: 40,
            background: `linear-gradient(160deg, rgba(139,92,246,0.45), rgba(46,16,101,0.8))`,
            border: `2px solid ${C.violet}`,
            boxShadow: `0 0 70px ${C.glow}`,
            textAlign: 'center',
            opacity: ap,
            transform: `translateY(${(1 - ap) * 40}px) scale(${1 + ap * 0.05})`,
          }}
        >
          <div style={{fontFamily: display, fontWeight: 900, fontSize: 48, color: '#fff'}}>Alfa Romeo 156</div>
          <div style={{marginTop: 22, display: 'inline-block', padding: '10px 26px', borderRadius: 999, background: '#fff', fontFamily: display, fontWeight: 800, fontSize: 28, color: '#2e1065'}}>Double wishbone</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Suspension: body rolls; strut wheel leans with it, wishbone wheel stays upright (camber gain). */
export const Suspension: React.FC = () => {
  const f = useCurrentFrame();
  const roll = interpolate(Math.sin(f / 22), [-1, 1], [-6, 6]) * prog(f, 20, 30);
  const car = (cx: number, label: string, upright: boolean, hl: boolean, delay: number) => {
    const p = prog(f, delay, 24);
    const wheelTilt = upright ? 0 : roll;
    return (
      <div style={{position: 'absolute', left: cx - 360, top: 330, width: 720, height: 520, opacity: p}}>
        <svg width={720} height={460} viewBox="0 0 720 460">
          {/* ground */}
          <line x1={20} y1={420} x2={700} y2={420} stroke={C.line} strokeWidth={3} />
          {/* body */}
          <g transform={`rotate(${roll} 360 250)`}>
            <path d="M150 260 L200 150 L520 150 L570 260 Z" fill="rgba(139,92,246,0.18)" stroke={hl ? C.violet : 'rgba(255,255,255,0.5)'} strokeWidth={4} strokeLinejoin="round" />
            <rect x={130} y={255} width={460} height={60} rx={20} fill="rgba(20,14,36,0.9)" stroke={hl ? C.violet : 'rgba(255,255,255,0.5)'} strokeWidth={4} />
          </g>
          {/* wheels */}
          {[160, 560].map((wx) => (
            <g key={wx} transform={`rotate(${wheelTilt} ${wx} 360)`}>
              <rect x={wx - 32} y={300} width={64} height={120} rx={14} fill="#1c1430" stroke={hl ? C.lilac : 'rgba(255,255,255,0.6)'} strokeWidth={4} />
            </g>
          ))}
          {/* links */}
          {upright
            ? [160, 560].flatMap((wx) => {
                const dir = wx < 360 ? 1 : -1;
                return [
                  <line key={`${wx}a`} x1={wx + dir * 30} y1={325} x2={360 - dir * 120} y2={300} stroke={C.lilac} strokeWidth={5} strokeLinecap="round" />,
                  <line key={`${wx}b`} x1={wx + dir * 30} y1={395} x2={360 - dir * 110} y2={380} stroke={C.lilac} strokeWidth={5} strokeLinecap="round" />,
                ];
              })
            : [160, 560].map((wx) => <line key={wx} x1={wx} y1={300} x2={wx + (wx < 360 ? 60 : -60)} y2={180} stroke="rgba(255,255,255,0.6)" strokeWidth={8} strokeLinecap="round" />)}
        </svg>
        <div style={{textAlign: 'center', marginTop: -10}}>
          <Pill text={label} solid={hl} size={34} />
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <StageBg intensity={0.5} />
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 90}}>
        <Kicker text="Camber gain" />
        <div style={{height: 14}} />
        <RiseWords text="In a corner, the tyre stays upright" size={70} align="center" delay={4} highlight={['upright']} />
      </AbsoluteFill>
      {car(520, 'MacPherson strut', false, false, 10)}
      {car(1400, 'Double wishbone', true, true, 22)}
    </AbsoluteFill>
  );
};

/* Twin Spark: one cylinder, two plugs. Main plug fires, the smaller second plug fires a moment later. */
export const TwinSpark: React.FC = () => {
  const f = useCurrentFrame();
  const cycle = 50;
  const t = (f - 30) % cycle;
  const on = f > 30;
  const s1 = on && t >= 0 && t < 6;
  const s2 = on && t >= 8 && t < 14;
  const flame = on ? interpolate(t, [0, 10, 26, 40], [0, 0.6, 1, 0], clamp) : 0;
  const plug = (x: number, small: boolean, spark: boolean) => (
    <g>
      <rect x={x - (small ? 10 : 14)} y={small ? 168 : 150} width={small ? 20 : 28} height={small ? 62 : 80} rx={6} fill="#e9d5ff" opacity={0.9} />
      <rect x={x - 4} y={small ? 230 : 230} width={8} height={18} fill="#a1a1aa" />
      {spark && <circle cx={x} cy={262} r={small ? 18 : 26} fill="#fde68a" style={{filter: 'blur(4px)'}} />}
    </g>
  );
  return (
    <AbsoluteFill>
      <StageBg intensity={0.5} />
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 140}}>
        <Kicker text="Twin Spark" />
        <div style={{height: 16}} />
        <RiseWords text={'Two plugs.\nOne cylinder.'} size={96} delay={4} highlight={['Two']} />
        <div style={{height: 40}} />
        {[
          ['Plug 1', 'main ignition', 18],
          ['Plug 2', 'smaller, fires a few ms later', 34],
          ['Goal', 'no unburned fuel left behind', 50],
        ].map(([a, b, d], i) => {
          const p = prog(f, d as number, 20);
          return (
            <div key={i} style={{display: 'flex', gap: 22, alignItems: 'baseline', marginBottom: 18, opacity: p, transform: `translateX(${(1 - p) * -30}px)`}}>
              <span style={{fontFamily: display, fontWeight: 800, fontSize: 40, color: C.violet, width: 150}}>{a}</span>
              <span style={{fontFamily: display, fontWeight: 600, fontSize: 36, color: C.ink}}>{b}</span>
            </div>
          );
        })}
      </AbsoluteFill>
      <svg width={700} height={700} viewBox="0 0 500 500" style={{position: 'absolute', right: 120, top: 190, opacity: prog(f, 8, 24)}}>
        {/* cylinder walls */}
        <path d="M90 140 L90 470 M410 140 L410 470" stroke="rgba(255,255,255,0.6)" strokeWidth={10} />
        <path d="M80 140 Q250 90 420 140" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={10} />
        {/* combustion */}
        <ellipse cx={250} cy={300} rx={150 * flame} ry={110 * flame} fill="url(#fl)" opacity={0.9} />
        <defs>
          <radialGradient id="fl">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="0.5" stopColor="#c084fc" />
            <stop offset="1" stopColor="rgba(124,58,237,0)" />
          </radialGradient>
        </defs>
        {/* piston */}
        <rect x={98} y={380 + 20 * flame} width={304} height={70} rx={10} fill="#2e1065" stroke={C.violet} strokeWidth={4} />
        {plug(190, false, s1)}
        {plug(320, true, s2)}
      </svg>
    </AbsoluteFill>
  );
};

/* Comment prompt: a chat bubble that types out the question. */
export const CommentCTA: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const p = prog(f, 4, 22);
  const chars = Math.floor(interpolate(f, [14, 14 + text.length * 1.2], [0, text.length], clamp));
  return (
    <AbsoluteFill>
      <StageBg shafts={false} horizon />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 160}}>
        <div style={{display: 'flex', gap: 30, alignItems: 'flex-start', opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
          <div style={{width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${C.violet}`, flexShrink: 0}}>
            <Img src={staticFile('logo.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.1)'}} />
          </div>
          <div style={{background: '#fff', borderRadius: '10px 46px 46px 46px', padding: '34px 50px', maxWidth: 1200, boxShadow: `0 0 60px ${C.glow}`}}>
            <div style={{fontFamily: display, fontWeight: 700, fontSize: 26, color: '#6d28d9', marginBottom: 8}}>Auto Genesis · Comments</div>
            <div style={{fontFamily: display, fontWeight: 800, fontSize: 52, color: '#140b24', lineHeight: 1.2}}>
              {text.slice(0, chars)}
              <span style={{opacity: Math.floor(f / 8) % 2 ? 1 : 0, color: C.violet}}>|</span>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Subscribe + like prompt: button gets "pressed" and flips to Subscribed, bell rings. */
export const SubscribeCTA: React.FC<{pressAt: number}> = ({pressAt}) => {
  const f = useCurrentFrame();
  const p = prog(f, 4, 22);
  const press = prog(f, pressAt, 8) * (1 - prog(f, pressAt + 8, 10));
  const done = f > pressAt + 6;
  const bell = done ? Math.sin((f - pressAt) / 2.5) * 18 * Math.exp(-(f - pressAt) / 25) : 0;
  const like = prog(f, pressAt + 30, 16);
  return (
    <AbsoluteFill>
      <StageBg shafts={false} horizon />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 180, gap: 50}}>
        <RiseWords text="More stories from the car world" size={76} align="center" highlight={['stories']} />
        <div style={{display: 'flex', gap: 30, alignItems: 'center', opacity: p, transform: `scale(${(0.9 + 0.1 * p) * (1 - press * 0.08)})`}}>
          <div
            style={{
              fontFamily: display,
              fontWeight: 800,
              fontSize: 50,
              color: done ? C.ink : '#fff',
              padding: '26px 64px',
              borderRadius: 999,
              background: done ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${C.violet}, #6d28d9)`,
              border: done ? `2px solid ${C.line}` : '1px solid rgba(255,255,255,0.3)',
              boxShadow: done ? 'none' : `0 0 60px ${C.glow}`,
            }}
          >
            {done ? 'Subscribed' : 'Subscribe'}
          </div>
          <div style={{width: 110, height: 110, borderRadius: '50%', background: C.glass, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width="54" height="54" viewBox="0 0 24 24" style={{transform: `rotate(${bell}deg)`}}>
              <path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 20a2 2 0 004 0" fill={done ? C.violet : 'none'} stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{width: 110, height: 110, borderRadius: '50%', background: like > 0.5 ? `linear-gradient(135deg, ${C.violet}, #6d28d9)` : C.glass, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.15 * Math.sin(like * Math.PI)})`}}>
            <svg width="54" height="54" viewBox="0 0 24 24">
              <path d="M7 10v10H4V10zM7 10l4-7a2 2 0 012 2v4h6a2 2 0 012 2l-2 7a2 2 0 01-2 2H7" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export {sec};
