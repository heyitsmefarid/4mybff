import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

/* Chiptune sound effects synthesised with Web Audio oscillators — no audio
   files to ship, and every blip is one square wave, which is exactly what a
   1988 sound chip would have done. */

const SoundCtx = createContext({ play: () => {}, muted: false, toggleMute: () => {} });

const sq = (f, d, delay = 0, v = 0.05, type = 'square') => ({ f, d, delay, v, type });

const VOICES = {
  move: [sq(440, 0.05)],
  key: [sq(880, 0.04, 0, 0.045)],
  select: [sq(660, 0.06), sq(990, 0.1, 0.05)],
  back: [sq(400, 0.06), sq(260, 0.1, 0.05)],
  page: [sq(520, 0.05), sq(700, 0.05, 0.04)],
  type: [sq(1400, 0.012, 0, 0.018)],
  reveal: [sq(740, 0.05), sq(1108, 0.1, 0.05)],
  open: [sq(300, 0.05), sq(600, 0.08, 0.04)],
  error: [sq(180, 0.18, 0, 0.07, 'sawtooth'), sq(90, 0.24, 0.09, 0.06, 'sawtooth')],
  unlock: [sq(523, 0.09), sq(659, 0.09, 0.09), sq(784, 0.09, 0.18), sq(1046, 0.26, 0.27)],
  win: [
    sq(523, 0.1),
    sq(659, 0.1, 0.1),
    sq(784, 0.1, 0.2),
    sq(1046, 0.1, 0.3),
    sq(784, 0.1, 0.4),
    sq(1046, 0.45, 0.5),
  ],
};

export function SoundProvider({ children }) {
  const ctxRef = useRef(null);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('bday.muted') === '1';
    } catch {
      return false;
    }
  });

  const play = useCallback(
    (name) => {
      if (muted) return;
      const notes = VOICES[name];
      if (!notes) return;

      try {
        if (!ctxRef.current) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ctxRef.current = new AC();
        }
        const ctx = ctxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        for (const n of notes) {
          const t0 = ctx.currentTime + n.delay;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = n.type;
          osc.frequency.setValueAtTime(n.f, t0);
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(n.v, t0 + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + n.d + 0.02);
        }
      } catch {
        /* Audio is a nicety — never let it break the page. */
      }
    },
    [muted]
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem('bday.muted', next ? '1' : '0');
      } catch {
        /* private browsing — just don't persist */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ play, muted, toggleMute }), [play, muted, toggleMute]);
  return <SoundCtx.Provider value={value}>{children}</SoundCtx.Provider>;
}

export const useSound = () => useContext(SoundCtx);
