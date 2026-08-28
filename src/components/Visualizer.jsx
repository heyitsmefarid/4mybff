import { useCallback, useEffect, useRef, useState } from 'react';

/* Spectrum bars driven by the real audio via a Web Audio AnalyserNode.
 *
 * Two modes:
 *   live — an mp3 is playing and the FFT drives every bar frame by frame.
 *   sim  — no audio (or the browser refused us a context), so the bars fall
 *          back to a canned CSS animation and nothing looks broken.
 *
 * Connecting is deliberately imperative: SongScreen calls connectRef.current()
 * from inside the play click, because an AudioContext may only start on a user
 * gesture. And the context is resumed BEFORE the media element is rerouted —
 * if it were rerouted into a suspended graph the song would play silently.
 */

const BARS = 32;

export default function Visualizer({ audioRef, playing, connectRef, pulseRef }) {
  const barsRef = useRef([]);
  const mirrorRef = useRef([]);
  const graphRef = useRef(null);
  const rafRef = useRef(0);
  const deadRef = useRef(false);
  const lastRef = useRef([]);   /* skip style writes that change nothing */
  const [live, setLive] = useState(false);

  const connect = useCallback(() => {
    if (graphRef.current || deadRef.current) return;
    const el = audioRef.current;
    if (!el) return;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('no web audio');
      const ctx = new AC();

      const wire = () => {
        if (ctx.state !== 'running') {
          deadRef.current = true;
          return;
        }
        const source = ctx.createMediaElementSource(el);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.74;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        graphRef.current = { ctx, analyser, data: new Uint8Array(analyser.frequencyBinCount) };
        setLive(true);
      };

      if (ctx.state === 'running') wire();
      else ctx.resume().then(wire).catch(() => { deadRef.current = true; });
    } catch {
      deadRef.current = true;
    }
  }, [audioRef]);

  useEffect(() => {
    if (connectRef) connectRef.current = connect;
  }, [connectRef, connect]);

  useEffect(() => {
    const bars = barsRef.current;

    const mirror = mirrorRef.current;

    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      bars.forEach((b) => b && (b.style.transform = 'scaleY(0.05)'));
      mirror.forEach((b) => b && (b.style.transform = 'scaleY(0.05)'));
      pulseRef?.current?.style.setProperty('--beat', '0');
      return;
    }

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const g = graphRef.current;
      if (!g) return;

      g.analyser.getByteFrequencyData(g.data);

      /* The top third of the spectrum is almost always empty on pop music, so
         only spread the bars across the part that actually moves. */
      const usable = Math.floor(g.data.length * 0.66);
      const n = bars.length;

      for (let i = 0; i < n; i++) {
        const bar = bars[i];
        if (!bar) continue;
        const from = Math.floor((i / n) * usable);
        const to = Math.max(from + 1, Math.floor(((i + 1) / n) * usable));
        let sum = 0;
        for (let j = from; j < to; j++) sum += g.data[j];
        const avg = sum / (to - from) / 255;
        const shaped = Math.min(1, Math.pow(avg, 0.72) * 1.3);
        const v = Math.max(0.05, shaped);
        /* 64 style writes a frame adds up; only touch what actually moved */
        if (Math.abs(v - (lastRef.current[i] ?? -1)) < 0.004) continue;
        lastRef.current[i] = v;
        const t = 'scaleY(' + v.toFixed(3) + ')';
        bar.style.transform = t;
        if (mirror[i]) mirror[i].style.transform = t;
      }

      /* Low end drives the cover's breathing. */
      let bass = 0;
      for (let j = 1; j < 7; j++) bass += g.data[j];
      bass = bass / 6 / 255;
      pulseRef?.current?.style.setProperty('--beat', Math.min(1, bass * 1.15).toFixed(3));
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, pulseRef]);

  return (
    <div className={'viz' + (playing ? ' is-on' : '') + (live ? ' is-live' : ' is-sim')}>
      <div className="viz__bars" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            className="viz__bar"
            style={{
              animationDelay: ((i * 97) % 900) + 'ms',
              animationDuration: 480 + ((i * 71) % 460) + 'ms',
            }}
          />
        ))}
      </div>

      <span className="viz__floor" aria-hidden="true" />

      {/* the same bars again, upside down and fading out — a reflection */}
      <div className="viz__bars viz__bars--mirror" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span
            key={i}
            ref={(el) => (mirrorRef.current[i] = el)}
            className="viz__bar"
            style={{
              animationDelay: ((i * 97) % 900) + 'ms',
              animationDuration: 480 + ((i * 71) % 460) + 'ms',
            }}
          />
        ))}
      </div>
    </div>
  );
}
