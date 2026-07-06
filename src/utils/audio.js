// ElevenLabs Audio Engine + Web Speech Fallback
// Voice: Alice, Voice ID: Xb7hH8MSUJpSbSDYk0k2

import audioMap from './audioMap.js';

const VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2';
const MODEL = 'eleven_multilingual_v2';

const STYLE_SETTINGS = {
  celebration:   { stability: 0.35, similarity_boost: 0.80, style: 0.85, use_speaker_boost: true },
  encouragement: { stability: 0.50, similarity_boost: 0.75, style: 0.60, use_speaker_boost: true },
  question:      { stability: 0.55, similarity_boost: 0.78, style: 0.45, use_speaker_boost: true },
  emphasis:      { stability: 0.45, similarity_boost: 0.80, style: 0.65, use_speaker_boost: true },
  thinking:      { stability: 0.60, similarity_boost: 0.72, style: 0.30, use_speaker_boost: false },
  statement:     { stability: 0.65, similarity_boost: 0.75, style: 0.25, use_speaker_boost: false },
  hint:          { stability: 0.58, similarity_boost: 0.76, style: 0.35, use_speaker_boost: false },
  explanation:   { stability: 0.62, similarity_boost: 0.74, style: 0.28, use_speaker_boost: false },
};

// ── Segment builder helpers ──
export const say      = (text) => ({ text, style: 'statement' });
export const ask      = (text) => ({ text, style: 'question' });
export const cheer    = (text) => ({ text, style: 'encouragement' });
export const emphasize= (text) => ({ text, style: 'emphasis' });
export const think    = (text) => ({ text, style: 'thinking' });
export const celebrate= (text) => ({ text, style: 'celebration' });
export const instruct = (text) => ({ text, style: 'statement' });

// ── Global audio state ──
let currentAudio = null;
let currentQueueId = null; // Symbol — changes on every stopNarration() to cancel pending segments

// ── URL lookup ──
export function getAudioUrl(text) {
  const key = text.trim();
  return (audioMap && audioMap[key]) ? audioMap[key] : null;
}

// ── Play a single segment ──
export async function playSegment(segment, enabled, queueId) {
  if (!enabled) return;
  // Abort if our queue was cancelled
  if (queueId !== currentQueueId) return;

  const { text, style } = segment;
  const pregenUrl = getAudioUrl(text);

  if (pregenUrl) {
    return new Promise((resolve) => {
      const audio = new Audio(pregenUrl);
      // If queue cancelled while loading, abort immediately
      if (queueId !== currentQueueId) { resolve(); return; }
      currentAudio = audio;
      audio.onended = () => { currentAudio = null; resolve(); };
      audio.onerror = () => { currentAudio = null; resolve(); };
      // Preload then play
      audio.load();
      const playPromise = audio.play();
      if (playPromise) playPromise.catch(() => { currentAudio = null; resolve(); });
    });
  }

  // Dynamic ElevenLabs via proxy
  try {
    if (queueId !== currentQueueId) return;
    const resp = await fetch('/api/elevenlabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice_id: VOICE_ID,
        model_id: MODEL,
        voice_settings: STYLE_SETTINGS[style] || STYLE_SETTINGS.statement,
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    if (queueId !== currentQueueId) return;
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      if (queueId !== currentQueueId) { URL.revokeObjectURL(url); resolve(); return; }
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; resolve(); };
      const p = audio.play();
      if (p) p.catch(() => { URL.revokeObjectURL(url); currentAudio = null; resolve(); });
    });
  } catch {
    // Web Speech API fallback
    if (queueId !== currentQueueId) return;
    return new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel(); // clear any queued speech first
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'en-US';
      utt.rate = 0.88;
      utt.pitch = 1.05;
      utt.onend = resolve;
      utt.onerror = resolve;
      window.speechSynthesis.speak(utt);
    });
  }
}

// ── Play a sequence of segments ──
export async function narrate(segments, enabled) {
  if (!enabled || !segments || segments.length === 0) return;

  // Each call to narrate() gets a fresh queueId
  // stopNarration() will invalidate the previous queueId
  const queueId = Symbol('narrate');
  currentQueueId = queueId;

  for (let i = 0; i < segments.length; i++) {
    // Check before every segment
    if (queueId !== currentQueueId) break;
    await playSegment(segments[i], enabled, queueId);
  }
}

// ── Stop everything immediately ──
export function stopNarration() {
  // Invalidate any running narrate() loop
  currentQueueId = null;

  // Stop currently playing audio
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = '';  // release resource immediately
    } catch {}
    currentAudio = null;
  }

  // Cancel Web Speech
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ── Web Audio API SFX ──
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return null; }
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(frequencies, durations) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    let t = ctx.currentTime;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const dur = durations[i] / 1000;
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    });
  } catch {}
}

export const SOUND_EFFECTS = {
  correct: () => playTone([880, 1100], [140, 140]),
  wrong:   () => playTone([220, 180], [200, 200]),
  badge:   () => playTone([523, 659, 784, 1047], [90, 90, 90, 180]),
  streak:  () => playTone([440, 880], [90, 180]),
  levelUp: () => playTone([523, 659, 784, 1047, 1319], [70, 70, 70, 70, 260]),
  click:   () => playTone([660], [70]),
};
