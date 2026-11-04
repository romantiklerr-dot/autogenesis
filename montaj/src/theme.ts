import {loadFont as loadMontserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadScript} from '@remotion/google-fonts/DancingScript';
import {Easing} from 'remotion';

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const display = loadMontserrat('normal', {
  weights: ['500', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext'],
}).fontFamily;
export const mono = loadMono('normal', {weights: ['500', '700'], subsets: ['latin', 'latin-ext']}).fontFamily;
export const script = loadScript('normal', {weights: ['700'], subsets: ['latin', 'latin-ext']}).fontFamily;

export const C = {
  bg: '#07050c',
  bg2: '#0e0a18',
  ink: '#f5f3ff',
  dim: 'rgba(237,233,254,0.62)',
  purple: '#8b5cf6',
  violet: '#a855f7',
  lilac: '#c4b5fd',
  deep: '#2e1065',
  glow: 'rgba(139,92,246,0.55)',
  glass: 'rgba(20,14,36,0.62)',
  line: 'rgba(196,181,253,0.22)',
};

// One easing for everything keeps the motion language consistent.
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const sec = (s: number) => Math.round(s * FPS);
