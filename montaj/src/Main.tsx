import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from './theme';
import {LowerThird, PhotoShot, VideoShot} from './components';
import {Agenda, CardPair, Chapter, Checklist, HookTitle, KeyLine, LogoSting, Outro, SpecCard, Timeline} from './scenes';
import {Bars, Choice, CommentCTA, Ranking, Rivals, SelespeedDiagram, SubscribeCTA, Suspension, TitleOverlay, TwinSpark} from './explainers';

/*
 * Edit decision list. Narration times are in seconds of public/narration_tight.wav
 * (the voice-over with long pauses shortened). The script's closing block
 * (verdict, conclusion, call to action) is moved after the engineering and
 * racing sections so the story ends on the conclusion. Gaps hold the agenda,
 * chapter cards and outro.
 */
type Piece = {voice: [number, number]} | {gap: number; id: string};

const EDL: Piece[] = [
  {gap: 0.4, id: 'pre'},
  {voice: [0, 23.4]},
  {gap: 4.6, id: 'agenda'},
  {voice: [23.4, 48.7]},
  {gap: 2.2, id: 'ch1'},
  {voice: [48.7, 101.33]},
  {gap: 2.2, id: 'ch2'},
  {voice: [101.33, 137.3]},
  {gap: 2.2, id: 'ch3'},
  {voice: [137.3, 174.7]},
  {gap: 2.2, id: 'ch4'},
  {voice: [272.72, 380.0]},
  {gap: 2.2, id: 'ch5'},
  {voice: [380.0, 409.27]},
  {gap: 2.2, id: 'ch6'},
  {voice: [174.7, 272.72]},
  {gap: 6.0, id: 'outro'},
];

const layout = (() => {
  let t = 0;
  const voices: {from: number; to: number; at: number}[] = [];
  const gaps: Record<string, {at: number; dur: number}> = {};
  for (const p of EDL) {
    if ('voice' in p) {
      voices.push({from: p.voice[0], to: p.voice[1], at: t});
      t += p.voice[1] - p.voice[0];
    } else {
      gaps[p.id] = {at: t, dur: p.gap};
      t += p.gap;
    }
  }
  return {voices, gaps, total: t};
})();

export const TOTAL = Math.round(layout.total * FPS);
const F = (s: number) => Math.round(s * FPS);

// Narration time -> timeline time. `end` picks the piece that ends at t rather than one that starts there.
const T = (t: number, end = false) => {
  const v = layout.voices.find((p) => (end ? t > p.from && t <= p.to : t >= p.from && t < p.to));
  if (!v) throw new Error(`time ${t} is not inside a voice piece`);
  return v.at + (t - v.from);
};

type Item = {start: number; end: number; node: (dur: number) => React.ReactNode};
const shots: Item[] = [];
const overlays: Item[] = [];

// Base layer helpers (narration time). Every shot cross-dissolves into the next.
const v = (t0: number, t1: number, src: string, start: number, move: 'in' | 'out' | 'left' | 'right' | 'up' = 'in', flip = false) =>
  shots.push({start: T(t0), end: T(t1, true), node: (d) => <VideoShot src={src} start={start} dur={d} move={move} flip={flip} />});
const ph = (t0: number, t1: number, src: string, move: 'in' | 'out' | 'left' | 'right' | 'up' = 'in') =>
  shots.push({start: T(t0), end: T(t1, true), node: (d) => <PhotoShot src={src} dur={d} move={move} />});
const sc = (t0: number, t1: number, node: (d: number) => React.ReactNode) => shots.push({start: T(t0), end: T(t1, true), node});
const gap = (id: string, node: (d: number) => React.ReactNode) => {
  const g = layout.gaps[id];
  shots.push({start: g.at, end: g.at + g.dur, node});
};
const ov = (t0: number, t1: number, node: (d: number) => React.ReactNode) => overlays.push({start: T(t0), end: T(t1, true), node});
const lt = (t0: number, t1: number, title: string, sub?: string) => ov(t0, t1, (d) => <LowerThird title={title} sub={sub} dur={d} />);
// frames from the start of a shot to a narration moment
const rel = (t0: number, t: number) => F(t - t0);

/* ---------------- HOOK ---------------- */
sc(0, 8.85, () => (
  <Checklist
    bg={{src: 'video_009.mp4', start: 0}}
    rows={[
      {text: 'Rattles like a diesel', tag: 'cold start'},
      {text: '8 spark plugs', tag: '4 cylinders'},
      {text: 'Selespeed robot', tag: 'hydraulic'},
    ]}
    at={[9, rel(0, 4.29), rel(0, 5.4)]}
    arrow="Drains your wallet"
    arrowAt={rel(0, 7.47)}
  />
));
sc(8.85, 15.2, () => <HookTitle kicker="Alfa Romeo 156" text={'WHY DO ALFISTI\nNEVER LET GO?'} highlight={['ALFISTI']} bg={{src: 'video_012.mp4', start: 2}} />);
v(15.2, 20.55, 'video_020.mp4', 1, 'in');
ov(15.2, 20.55, () => <TitleOverlay kicker="Alfa Romeo 156" text="The dark, passionate secret" highlight={['passionate']} />);
sc(20.55, 23.4, () => <LogoSting />);
gap('agenda', () => (
  <Agenda
    step={22}
    items={[
      {text: 'Birth & design', icon: 'film'},
      {text: 'Cabin & Selespeed', icon: 'gear'},
      {text: 'Twin Spark & Busso V6', icon: 'bolt'},
      {text: 'Racing glory', icon: 'trophy'},
    ]}
  />
));

/* ---------------- BIRTH ---------------- */
sc(23.4, 29.0, () => <KeyLine kicker="Mid-1990s" text={'Alfa Romeo was\nalmost finished'} highlight={['finished']} />);
v(29.0, 33.5, 'video_005.mp4', 0.5, 'in', true);
lt(31.44, 33.5, "Management's final call");
sc(33.5, 36.75, () => <Choice kicker="The final call" a="Become legends" b="Close up shop" pick="a" pickAt={70} />);
v(36.75, 41.6, 'video_005.mp4', 5, 'left', true);
lt(37.3, 41.6, 'Alfa Romeo 156', 'Born from a life-or-death struggle');
sc(41.6, 48.7, () => <Ranking kicker="1998" title={'European Car\nof the Year'} rows={['Alfa Romeo 156', 'Mercedes-Benz E-Class', 'Volkswagen Golf']} photo="foto_0008.jpg" />);
gap('ch1', () => <Chapter n={1} title="The Design" bg={{src: 'video_006.mp4', start: 15}} />);

/* ---------------- DESIGN ---------------- */
v(48.7, 54.0, 'video_006.mp4', 0, 'right');
lt(50.7, 54.0, 'Walter de Silva', 'Lead designer');
v(54.0, 57.3, 'video_006.mp4', 7, 'in');
lt(54.1, 57.3, '4-door saloon', 'that looks like a 2-door coupé');
v(57.3, 64.3, 'video_013.mp4', 30, 'in');
lt(57.6, 64.1, 'Hidden rear door handles', 'Tucked into the C-pillar');
v(64.3, 68.3, 'video_006.mp4', 12, 'left');
v(68.3, 72.8, 'video_002.mp4', 0, 'in');
lt(68.5, 72.8, 'A huge grille', 'No room left for a centred plate');
ph(72.8, 76.1, 'foto_0008.jpg', 'in');
v(76.1, 79.7, 'video_001.mp4', 20, 'out');
v(79.7, 84.2, 'video_009.mp4', 0, 'right');
v(84.2, 89.5, 'video_009.mp4', 4.5, 'in');
lt(84.2, 89.4, 'Sportwagon', 'The estate version');
sc(89.5, 94.9, () => (
  <Bars
    kicker="Boot capacity"
    title="Smaller than the saloon"
    unit="L"
    max={420}
    rows={[
      {label: '156 Saloon', value: 378},
      {label: '156 Sportwagon', value: 360, hl: true},
    ]}
  />
));
v(94.9, 98.0, 'video_009.mp4', 13.5, 'in');
sc(98.0, 101.33, () => <KeyLine text={"We don't carry cargo.\nWe carry style."} highlight={['style']} />);
gap('ch2', () => <Chapter n={2} title="The Cabin" photo="foto_0014.jpg" />);

/* ---------------- CABIN ---------------- */
v(101.33, 106.3, 'video_003.mp4', 0, 'in');
lt(103.8, 106.3, 'Deep-set gauges', 'Each dial in its own tube');
ph(106.3, 112.9, 'foto_0014.jpg', 'left');
lt(106.5, 112.7, 'Console angled to the driver', "The passenger can't see the A/C");
sc(112.9, 119.2, () => <KeyLine kicker="Cup holders: zero" text={"You're not here to drink coffee.\nYou're here to drive."} highlight={['drive']} />);
v(119.2, 122.8, 'video_013.mp4', 41, 'in');
lt(119.3, 122.8, 'Wheel far, pedals close');
v(122.8, 125.0, 'video_003.mp4', 3, 'in');
lt(122.9, 125.0, 'The “monkey position”');
v(125.0, 131.7, 'video_007.mp4', 0, 'in');
v(131.7, 134.3, 'video_003.mp4', 5.5, 'in');
lt(131.8, 134.3, 'Momo seats', 'Wrap around you like a glove');
v(134.3, 137.3, 'video_001.mp4', 12, 'out');
gap('ch3', () => <Chapter n={3} title="Selespeed" sub="The scary part" bg={{src: 'video_001.mp4', start: 8}} />);

/* ---------------- SELESPEED ---------------- */
sc(137.3, 158.0, () => <SelespeedDiagram beats={{myth: rel(137.3, 144.0), culprit: rel(137.3, 146.91), pump: rel(137.3, 150.03), light: rel(137.3, 155.01)}} />);
v(158.0, 161.1, 'video_007.mp4', 7, 'in');
lt(158.1, 161.0, 'Well maintained?', 'A joy to drive');
sc(161.1, 168.0, () => (
  <SpecCard
    title="Q-System"
    photo="foto_0015.jpg"
    rows={[
      ['Available on', '2.5 V6 only'],
      ['Made by', 'Aisin'],
      ['Type', 'Torque-converter auto'],
      ['The trick', 'H-pattern manual gate'],
    ]}
  />
));
v(168.0, 171.3, 'video_008.mp4', 1, 'in');
v(171.3, 174.7, 'video_012.mp4', 4, 'left');
gap('ch4', () => <Chapter n={4} title="Chassis & Engines" photo="foto_0011.jpg" />);

/* ---------------- CHASSIS & ENGINES ---------------- */
sc(272.72, 286.0, () => <Rivals carsAt={[rel(272.72, 274.92), rel(272.72, 276.09), rel(272.72, 277.62)]} alfaAt={rel(272.72, 282.3)} />);
sc(286.0, 292.4, () => <Suspension />);
sc(292.4, 300.5, () => (
  <Bars
    kicker="Steering"
    title="Turns lock to lock"
    unit="turns"
    max={4}
    rows={[
      {label: 'Alfa Romeo 156', value: 2.2, hl: true},
      {label: 'Typical family car', value: 3.5},
    ]}
  />
));
v(300.5, 304.5, 'video_012.mp4', 12, 'in');
v(304.5, 307.8, 'video_008.mp4', 9, 'left');
ph(307.8, 313.2, 'foto_0026.jpg', 'in');
lt(308.0, 313.1, 'Twin Spark', '8 plugs · 4 cylinders');
sc(313.2, 320.6, () => <TwinSpark />);
ph(320.6, 325.2, 'foto_0023.jpg', 'out');
lt(320.8, 325.1, '8 spark plugs', '…and the bill to match');
v(325.2, 332.2, 'video_001.mp4', 2.8, 'in');
lt(327.8, 332.1, 'The morning problem', '2–3 seconds of diesel rattle');
sc(332.2, 344.4, () => (
  <Checklist
    bg={{src: 'video_001.mp4', start: 13}}
    rows={[{text: 'Culprit: cam variator'}, {text: "Teflon seal can't hold oil"}, {text: 'Metal slapping on metal'}]}
    at={[4, rel(332.2, 334.44), rel(332.2, 337.5)]}
    arrow="Always listen cold"
    arrowAt={rel(332.2, 340.89)}
  />
));
v(344.4, 349.2, 'video_013.mp4', 1, 'in');
v(349.2, 352.0, 'video_015.mp4', 0, 'in');
lt(349.4, 352.0, 'Busso V6', "Alfa's sacred engine");
v(352.0, 357.0, 'video_015.mp4', 3, 'in');
v(357.0, 362.5, 'video_015.mp4', 9, 'left');
ph(362.5, 369.1, 'foto_0009.jpg', 'in');
lt(362.6, 369.0, 'Giuseppe Busso', 'Former Ferrari engineer');
sc(369.1, 380.0, () => (
  <Timeline
    title="End of an era"
    step={rel(369.1, 373.3) - 10}
    items={[
      {year: '2005', text: 'V6 production ends at Arese'},
      {year: '2006', text: 'Giuseppe Busso passes away, 3 January'},
    ]}
  />
));
gap('ch5', () => <Chapter n={5} title="Racing Glory" bg={{src: 'video_016.mp4', start: 60}} />);

/* ---------------- RACING ---------------- */
v(380.0, 384.6, 'video_016.mp4', 30, 'in');
v(384.6, 388.7, 'video_016.mp4', 150, 'in');
lt(384.7, 388.6, 'vs BMW E46', 'European Touring Car Championship');
sc(388.7, 392.8, () => <Choice kicker="The old rule" a="Front-wheel drive" b="Rear-wheel drive" pick="a" pickAt={100} />);
v(392.8, 396.5, 'video_017.mp4', 10, 'in');
lt(392.9, 396.4, 'Fabrizio Giovanardi', 'European champion');
ph(396.5, 400.4, 'foto_0002.jpg', 'in');
sc(400.4, 409.27, () => (
  <Timeline
    title="Four years. Four titles."
    step={22}
    items={[
      {year: '2000', text: 'Giovanardi'},
      {year: '2001', text: 'Giovanardi'},
      {year: '2002', text: 'Giovanardi'},
      {year: '2003', text: 'Tarquini'},
    ]}
  />
));
gap('ch6', () => <Chapter n={6} title="The Verdict" photo="foto_0021.jpg" />);

/* ---------------- VERDICT ---------------- */
v(174.7, 179.6, 'video_011.mp4', 0, 'right');
lt(174.9, 179.5, 'Not a “just add oil” car');
v(179.6, 184.86, 'video_013.mp4', 10.5, 'in');
v(184.86, 191.0, 'video_012.mp4', 16, 'in');
lt(185.0, 190.9, 'Treat it with respect', 'Steering feel rare even in pricier cars');
v(191.0, 195.1, 'video_010.mp4', 0, 'in');
lt(191.1, 195.0, 'Giorgetto Giugiaro', '2003 facelift');
sc(195.1, 204.4, () => (
  <CardPair
    title="From sorrowful to angry"
    highlight={['angry']}
    a={{label: '1997', photo: 'foto_0019.jpg', x: 240, y: 280, w: 680, h: 620, tilt: -2}}
    b={{label: '2003 facelift', photo: 'foto_0016.jpg', x: 1000, y: 280, w: 680, h: 620, delay: 10, tilt: 2}}
  />
));
v(204.4, 206.85, 'video_020.mp4', 5, 'in');
sc(206.85, 211.5, () => <KeyLine text={"One thing didn't change:\nthe soul."} highlight={['soul']} />);
v(211.5, 216.2, 'video_005.mp4', 9, 'in', true);
sc(216.2, 227.3, () => (
  <Checklist
    bg={{src: 'video_016.mp4', start: 100}}
    rows={[{text: "World's first common-rail car", tag: '156 JTD'}, {text: 'European champion', tag: '4 years running'}, {text: 'The sacred Busso V6'}]}
    at={[rel(216.2, 217.11), rel(216.2, 220.5), rel(216.2, 224.04)]}
  />
));
v(227.3, 232.0, 'video_006.mp4', 17, 'in');
v(232.0, 236.7, 'video_001.mp4', 25, 'left');
v(236.7, 242.4, 'video_011.mp4', 7, 'in');
sc(242.4, 247.0, () => <KeyLine kicker="The answer" text={'The most beautiful mistake\nin automotive history'} highlight={['beautiful']} />);
v(247.0, 251.0, 'video_019.mp4', 0, 'in');
sc(251.0, 258.5, () => <Choice kicker="My friends" title="What makes a driver's car?" a="Mechanical feel" b="Digital power" />);
sc(258.5, 263.4, () => <CommentCTA text="Tell us in the comments — I'll reply to every one." />);
sc(263.4, 272.72, () => <SubscribeCTA pressAt={rel(263.4, 270.06)} />);
gap('outro', () => <Outro />);

/* ---------------- RENDER ---------------- */
const FADE = 12;

const Fade: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, FADE], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

const gapRanges = Object.values(layout.gaps).map((g) => [F(g.at), F(g.at + g.dur)]);
const padVolume = (f: number) => {
  const inGap = gapRanges.some(([a, b]) => f >= a - 10 && f <= b + 10);
  const fadeIn = interpolate(f, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(f, [TOTAL - 120, TOTAL], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (inGap ? 0.16 : 0.06) * fadeIn * fadeOut;
};

const sfx: {at: number; src: string; vol: number}[] = [];
const logoAt = T(20.55);
sfx.push({at: logoAt - 2.5, src: 'riser', vol: 0.22}, {at: logoAt, src: 'impact', vol: 0.45});
[0, 1, 2, 3].forEach((i) => sfx.push({at: layout.gaps.agenda.at + (30 + i * 22) / FPS, src: 'pop', vol: 0.18}));
['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'].forEach((id) => sfx.push({at: layout.gaps[id].at - 0.3, src: 'whoosh_soft', vol: 0.28}));
sfx.push({at: layout.gaps.outro.at, src: 'shimmer', vol: 0.25});
sfx.push({at: T(270.06), src: 'pop', vol: 0.2});

export const Main: React.FC = () => (
  <AbsoluteFill style={{background: '#07050c'}}>
    {shots.map((s, i) => {
      const from = F(s.start);
      const dur = F(s.end) - from;
      return (
        <Sequence key={`s${i}`} from={from} durationInFrames={dur + FADE} premountFor={30}>
          <Fade>{s.node((dur + FADE) / FPS)}</Fade>
        </Sequence>
      );
    })}
    {overlays.map((o, i) => {
      const from = F(o.start);
      const dur = F(o.end) - from;
      return (
        <Sequence key={`o${i}`} from={from} durationInFrames={dur}>
          {o.node(dur / FPS)}
        </Sequence>
      );
    })}

    {layout.voices.map((p, i) => (
      <Sequence key={`v${i}`} from={F(p.at)} durationInFrames={F(p.to - p.from)}>
        <Audio src={staticFile('narration_tight.wav')} startFrom={F(p.from)} />
      </Sequence>
    ))}
    <Audio src={staticFile('sfx/pad.wav')} loop volume={padVolume} />
    {sfx.map((s, i) => (
      <Sequence key={`x${i}`} from={Math.max(0, F(s.at))} durationInFrames={F(3)}>
        <Audio src={staticFile(`sfx/${s.src}.wav`)} volume={s.vol} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
