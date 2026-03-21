import { useRef, useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import usePreferencesStore from '../stores/preferencesStore';

// ---------------------------------------------------------------------------
// Tiny inline WAV generator
// ---------------------------------------------------------------------------
// Builds a mono 16-bit PCM WAV data-URI from a Float32Array of samples.
function samplesToWavDataURI(samples, sampleRate = 22050) {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);          // sub-chunk size
  view.setUint16(20, 1, true);           // PCM
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);           // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  // Convert to base64 data URI
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

// ---------------------------------------------------------------------------
// Sound generators -- produce Float32Array samples for each sound type
// ---------------------------------------------------------------------------
const RATE = 22050;

function generateClick(freq, duration, volume) {
  const len = Math.floor(RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const envelope = Math.exp(-t * (1 / duration) * 6); // fast decay
    samples[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
  }
  return samples;
}

function generateNoise(duration, volume) {
  const len = Math.floor(RATE * duration);
  const samples = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const envelope = Math.exp(-t * (1 / duration) * 8);
    samples[i] = (Math.random() * 2 - 1) * envelope * volume;
  }
  return samples;
}

function mixSamples(a, b) {
  const len = Math.max(a.length, b.length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (i < a.length ? a[i] : 0) + (i < b.length ? b[i] : 0);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Sound pack definitions
// ---------------------------------------------------------------------------
function buildSoftPack() {
  return {
    keystroke: samplesToWavDataURI(generateClick(800, 0.04, 0.25)),
    error: samplesToWavDataURI(generateClick(300, 0.08, 0.3)),
    complete: samplesToWavDataURI(generateClick(1200, 0.2, 0.35)),
    countdown: samplesToWavDataURI(generateClick(600, 0.1, 0.3)),
  };
}

function buildMechanicalPack() {
  const clickTone = generateClick(1400, 0.02, 0.4);
  const clickNoise = generateNoise(0.03, 0.35);
  return {
    keystroke: samplesToWavDataURI(mixSamples(clickTone, clickNoise)),
    error: samplesToWavDataURI(generateClick(200, 0.1, 0.45)),
    complete: samplesToWavDataURI(
      mixSamples(generateClick(880, 0.15, 0.35), generateClick(1320, 0.15, 0.25))
    ),
    countdown: samplesToWavDataURI(generateClick(700, 0.08, 0.35)),
  };
}

function buildTypewriterPack() {
  const strikeNoise = generateNoise(0.04, 0.5);
  const strikeTone = generateClick(500, 0.015, 0.3);
  return {
    keystroke: samplesToWavDataURI(mixSamples(strikeNoise, strikeTone)),
    error: samplesToWavDataURI(
      mixSamples(generateNoise(0.06, 0.35), generateClick(180, 0.06, 0.3))
    ),
    complete: samplesToWavDataURI(
      mixSamples(generateClick(660, 0.25, 0.35), generateNoise(0.08, 0.2))
    ),
    countdown: samplesToWavDataURI(
      mixSamples(generateClick(440, 0.06, 0.35), generateNoise(0.03, 0.15))
    ),
  };
}

const PACKS = {
  soft: null,
  mechanical: null,
  typewriter: null,
};

function getPackSources(packName) {
  if (!PACKS[packName]) {
    if (packName === 'soft') PACKS[packName] = buildSoftPack();
    else if (packName === 'mechanical') PACKS[packName] = buildMechanicalPack();
    else if (packName === 'typewriter') PACKS[packName] = buildTypewriterPack();
  }
  return PACKS[packName];
}

// ---------------------------------------------------------------------------
// Howl instance cache -- one Howl per (pack, sound) pair
// ---------------------------------------------------------------------------
const howlCache = {};

function getHowl(packName, soundType) {
  if (packName === 'silent') return null;
  const key = `${packName}:${soundType}`;
  if (!howlCache[key]) {
    const sources = getPackSources(packName);
    if (!sources) return null;
    howlCache[key] = new Howl({
      src: [sources[soundType]],
      volume: 1.0,
      preload: true,
    });
  }
  return howlCache[key];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export default function useSound() {
  const soundPack = usePreferencesStore((s) => s.soundPack);
  const packRef = useRef(soundPack);

  useEffect(() => {
    packRef.current = soundPack;
  }, [soundPack]);

  // Pre-warm howl instances when pack changes
  useEffect(() => {
    if (soundPack === 'silent') return;
    ['keystroke', 'error', 'complete', 'countdown'].forEach((type) => {
      getHowl(soundPack, type);
    });
  }, [soundPack]);

  const play = useCallback((soundType) => {
    const howl = getHowl(packRef.current, soundType);
    if (howl) howl.play();
  }, []);

  const playKeystroke = useCallback(() => play('keystroke'), [play]);
  const playError = useCallback(() => play('error'), [play]);
  const playComplete = useCallback(() => play('complete'), [play]);
  const playCountdown = useCallback(() => play('countdown'), [play]);

  return { playKeystroke, playError, playComplete, playCountdown };
}
