import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import content from '../content.js';
import TopBar from '../components/TopBar.jsx';
import PixelIcon from '../components/PixelIcon.jsx';
import Visualizer from '../components/Visualizer.jsx';
import Letter from '../components/Letter.jsx';
import { useSound } from '../hooks/useSound.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { assetUrl, clamp, formatTime, pixelArt } from '../lib/util.js';
import './song.css';

const SEGMENTS = 40;
const SKIP = 10;

export default function SongScreen({ onBack }) {
  const { play } = useSound();
  const { theme } = useTheme();
  const song = content.song;
  const src = assetUrl(song.file);
  const cover = assetUrl(song.cover);

  const audioRef = useRef(null);
  const lyricsRef = useRef(null);
  const artRef = useRef(null); /* the bass pulse is written onto this */
  const connectViz = useRef(null); /* Visualizer hands us its connect() */
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  /* If the mp3 or the cover isn't there yet, degrade to preview mode and
     pixel art rather than a dead player and a broken image. */
  const [audioFailed, setAudioFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [duration, setDuration] = useState(song.duration || 0);

  const hasAudio = Boolean(src) && !audioFailed;

  /* With no mp3 dropped in yet, a plain timer drives the player so every
     animation can still be previewed. */
  useEffect(() => {
    if (hasAudio || !playing) return;
    const id = setInterval(() => {
      setTime((t) => (t + 0.25 >= duration ? 0 : t + 0.25));
    }, 250);
    return () => clearInterval(id);
  }, [hasAudio, playing, duration]);

  const toggle = useCallback(() => {
    play('select');
    if (!hasAudio) {
      setPlaying((p) => !p);
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      connectViz.current?.();
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [hasAudio, playing, play]);

  const seek = useCallback(
    (seconds) => {
      const t = clamp(seconds, 0, duration || 0);
      if (hasAudio && audioRef.current) audioRef.current.currentTime = t;
      setTime(t);
    },
    [duration, hasAudio]
  );

  const nudge = (delta) => {
    play('move');
    seek(time + delta);
  };

  const progress = duration > 0 ? clamp(time / duration, 0, 1) : 0;

  const onBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    play('key');
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const onBarKey = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nudge(SKIP);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nudge(-SKIP);
    }
  };

  const lyrics = song.lyrics || [];
  const activeLine = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (time + 0.01 >= lyrics[i].t) idx = i;
      else break;
    }
    return idx;
  }, [time, lyrics]);

  useEffect(() => {
    const box = lyricsRef.current;
    if (!box || activeLine < 0) return;
    const el = box.querySelector('[data-active="true"]');
    if (!el) return;
    box.scrollTo({
      top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [activeLine]);

  const coverArt =
    cover && !coverFailed ? cover : pixelArt(7, { size: 24, density: 0.55, theme });

  /* Accepts either an array of paragraphs or a single string. */
  const dedication = Array.isArray(song.dedication)
    ? song.dedication
    : song.dedication
      ? [song.dedication]
      : [];

  /* The letter signs itself once yourName is filled in — until then the
     placeholder would land right under the closing line and flatten it. */
  const signature = content.yourName && content.yourName !== 'YOUR NAME' ? content.yourName : '';

  return (
    <div className="screen song">
      <div className="screen__inner song__inner">
        <TopBar title={song.heading} onBack={onBack} />

        {/* --------- player on one side, the letter on the other ----------- */}
        <div className="song__split">
          <section className="song__player px-box">
          <div className="song__hero">
            <div className="song__art" ref={artRef}>
              <span className={'song__disc' + (playing ? ' is-out' : '')} aria-hidden="true">
                <span className="song__disc-face">
                  <span className="song__disc-pin">
                    <PixelIcon name="heart" size={10} color="var(--bg-0)" />
                  </span>
                </span>
              </span>

              <div className={'song__cover px-box is-glow' + (playing ? ' is-playing' : '')}>
                <img
                  src={coverArt}
                  alt=""
                  className="song__cover-img"
                  onError={() => setCoverFailed(true)}
                />
                <span className="song__cover-scan" aria-hidden="true" />
              </div>
            </div>

            <div className="song__meta">
              <p className="song__now">
                <span className={'song__dot' + (playing ? ' is-on' : '')} />
                {playing ? 'NOW PLAYING' : 'PAUSED'}
              </p>
              <h2 className="song__title glow-gold">{song.title}</h2>
              <p className="song__artist">{song.artist}</p>
              <p className="song__album">{song.album}</p>
            </div>
          </div>

            {/* A cassette whose reels turn while the song plays, and whose
                tape actually winds from the left spool to the right one as
                the track advances. */}
            <div className="tape" aria-hidden="true">
              <div className="tape__deck">
                <span className="tape__reel">
                  <span className="tape__wound" style={{ '--fill': (1 - progress).toFixed(3) }} />
                  <span className={'tape__hub' + (playing ? ' is-spinning' : '')} />
                </span>
                <span className="tape__strand" />
                <span className="tape__reel">
                  <span className="tape__wound" style={{ '--fill': progress.toFixed(3) }} />
                  <span className={'tape__hub' + (playing ? ' is-spinning' : '')} />
                </span>
              </div>
              <span className="tape__lip" />
            </div>

            <Visualizer
              audioRef={audioRef}
              playing={playing}
              connectRef={connectViz}
              pulseRef={artRef}
            />

            <div className="song__scrub">
              <span className="song__time">{formatTime(time)}</span>

              <div
                className="song__bar"
                role="slider"
                tabIndex={0}
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(time)}
                onClick={onBarClick}
                onKeyDown={onBarKey}
              >
                {Array.from({ length: SEGMENTS }, (_, i) => {
                  const on = i / SEGMENTS < progress;
                  const head = on && (i + 1) / SEGMENTS >= progress;
                  return (
                    <span
                      key={i}
                      className={'song__seg' + (on ? ' is-on' : '') + (head ? ' is-head' : '')}
                    />
                  );
                })}

                <span
                  className="song__playhead"
                  style={{ left: (progress * 100).toFixed(2) + '%' }}
                  aria-hidden="true"
                >
                  <PixelIcon name="heart" size={12} color="var(--gold)" />
                </span>
              </div>

              <span className="song__time">{formatTime(duration)}</span>
            </div>

            <div className="song__controls">
              <button type="button" className="btn btn--icon btn--ghost" aria-label="Shuffle" disabled>
                <PixelIcon name="shuffle" size={12} />
              </button>

              <button
                type="button"
                className="btn btn--icon btn--ink"
                onClick={() => nudge(-SKIP)}
                aria-label={'Back ' + SKIP + ' seconds'}
              >
                <PixelIcon name="prev" size={14} />
              </button>

              <button
                type="button"
                className="btn song__play btn--gold"
                onClick={toggle}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                <PixelIcon name={playing ? 'pause' : 'play'} size={20} color="var(--bg-1)" />
              </button>

              <button
                type="button"
                className="btn btn--icon btn--ink"
                onClick={() => nudge(SKIP)}
                aria-label={'Forward ' + SKIP + ' seconds'}
              >
                <PixelIcon name="next" size={14} />
              </button>

              <button type="button" className="btn btn--icon btn--ghost" aria-label="Repeat" disabled>
                <PixelIcon name="repeat" size={12} />
              </button>
            </div>

            {!hasAudio && (
              <p className="song__notice">
                PREVIEW MODE &middot; DROP {song.file || 'YOUR MP3'} INTO public/media/
              </p>
            )}
          </section>

          <Letter
            label={song.dedicationLabel || 'DEDICATION'}
            forName={content.herName}
            paragraphs={dedication}
            signature={signature}
            scroll
          />
        </div>

        {lyrics.length > 0 && (
          <section className="song__right px-box">
            <header className="song__lyr-head">
              <PixelIcon name="note" size={12} color="var(--acc)" />
              LYRICS
            </header>

            <div className="song__lyrics" ref={lyricsRef}>
              {lyrics.map((l, i) => (
                <button
                  key={i}
                  type="button"
                  data-active={i === activeLine}
                  className={
                    'song__line' +
                    (i === activeLine ? ' is-active' : '') +
                    (i < activeLine ? ' is-past' : '')
                  }
                  onClick={() => {
                    play('key');
                    seek(l.t);
                  }}
                >
                  {l.line}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {hasAudio && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || song.duration || 0)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onError={() => {
            setAudioFailed(true);
            setPlaying(false);
          }}
          onEnded={() => {
            setPlaying(false);
            setTime(0);
          }}
        />
      )}
    </div>
  );
}
