import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import content from '../content.js';
import TopBar from '../components/TopBar.jsx';
import PixelIcon from '../components/PixelIcon.jsx';
import TypeWriter from '../components/TypeWriter.jsx';
import Letter from '../components/Letter.jsx';
import { useSound } from '../hooks/useSound.jsx';
import './reasons.css';

const STORE_KEY = 'bday.reasons';
const CONFETTI = 28;
const CONFETTI_COLORS = ['var(--ink)', 'var(--acc)', 'var(--gold)', 'var(--violet)', 'var(--lime)'];

/* Memoised: unlocking one tile would otherwise re-render all 102 of them on
   every single tap. */
const Tile = memo(function Tile({ index, isOpen, onOpen }) {
  return (
    <button
      type="button"
      className={'rs__tile px-box' + (isOpen ? ' is-open' : '')}
      style={{ animationDelay: (index % 20) * 22 + 'ms' }}
      onClick={() => onOpen(index)}
      aria-label={'Reason ' + (index + 1)}
    >
      <span className="rs__tile-num">{index + 1}</span>
      <span className="rs__tile-icon">
        <PixelIcon
          name={isOpen ? 'heart' : 'lock'}
          size={13}
          color={isOpen ? 'var(--ink)' : 'var(--dim)'}
        />
      </span>
    </button>
  );
});

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: CONFETTI }, (_, i) => ({
        key: i,
        style: {
          left: ((i * 17) % 100) + '%',
          width: 10 + ((i * 5) % 12) + 'px',
          height: 10 + ((i * 5) % 12) + 'px',
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDuration: 2.4 + ((i * 7) % 22) / 10 + 's',
          animationDelay: ((i * 11) % 18) / 10 + 's',
          '--drift': (i % 2 ? 1 : -1) * (20 + ((i * 13) % 90)) + 'px',
          '--spin': (i % 2 ? 1 : -1) * (360 + ((i * 37) % 480)) + 'deg',
        },
      })),
    []
  );

  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b) => (
        <span key={b.key} className="confetti__bit pixel-heart" style={b.style} />
      ))}
    </div>
  );
}

export default function ReasonsScreen({ onBack }) {
  const { play } = useSound();
  const list = content.reasons.list;
  const total = list.length;

  const [unlocked, setUnlocked] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || '[]'));
    } catch {
      return new Set();
    }
  });
  const [open, setOpen] = useState(null);
  const [party, setParty] = useState(false);

  /* Read-only mirror, so callbacks can check what's unlocked without taking a
     dependency on the set — which would break Tile's memoisation. */
  const unlockedRef = useRef(unlocked);
  useEffect(() => {
    unlockedRef.current = unlocked;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify([...unlocked]));
    } catch {
      /* private browsing — progress just won't persist */
    }
  }, [unlocked]);

  const done = unlocked.size >= total && total > 0;

  useEffect(() => {
    if (!done) return;
    play('win');
    setParty(true);
    const id = setTimeout(() => setParty(false), 6000);
    return () => clearTimeout(id);
  }, [done, play]);

  /* Whatever card is open is, by definition, unlocked. Doing it in an effect
     keeps the state updaters pure — a setState called inside another updater
     runs twice under StrictMode and double-fires its sound. */
  useEffect(() => {
    if (open === null) return;
    setUnlocked((cur) => {
      if (cur.has(open)) return cur;
      const next = new Set(cur);
      next.add(open);
      return next;
    });
  }, [open]);

  const openTile = useCallback(
    (i) => {
      play(unlockedRef.current.has(i) ? 'open' : 'reveal');
      setOpen(i);
    },
    [play]
  );

  const step = useCallback(
    (dir) => {
      play('move');
      setOpen((i) => (i === null ? null : (i + dir + total) % total));
    },
    [total, play]
  );

  const close = useCallback(() => {
    play('back');
    setOpen(null);
  }, [play]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, close]);

  const pct = total ? unlocked.size / total : 0;
  const heading = content.reasons.heading || total + ' REASONS';

  return (
    <div className="screen reasons">
      {party && <Confetti />}

      <div className="screen__inner">
        <TopBar title={heading} sub={content.reasons.sub} onBack={onBack}>
          <span className="rs__actions">
            <button
              type="button"
              className="btn btn--ghost rs__mini"
              onClick={() => {
                play('reveal');
                setUnlocked(new Set(list.map((_, i) => i)));
              }}
            >
              REVEAL ALL
            </button>
            <button
              type="button"
              className="btn btn--ghost rs__mini"
              onClick={() => {
                play('back');
                setUnlocked(new Set());
              }}
            >
              RESET
            </button>
          </span>
        </TopBar>

        <div className="rs__progress">
          <span className="rs__count glow-ink">
            {String(unlocked.size).padStart(3, '0')} / {total}
          </span>
          <span className="rs__meter" aria-hidden="true">
            {Array.from({ length: 25 }, (_, i) => (
              <span key={i} className={'rs__meter-seg' + (i / 25 < pct ? ' is-on' : '')} />
            ))}
          </span>
          <span className="rs__pct">{Math.round(pct * 100)}%</span>
        </div>

        {done && (
          <div className="rs__done px-box is-glow">
            <p className="rs__done-title glow-gold">{content.reasons.finished}</p>
            <p className="rs__done-sub">{content.reasons.finishedSub}</p>
          </div>
        )}

        <div className="rs__grid">
          {list.map((_, i) => (
            <Tile key={i} index={i} isOpen={unlocked.has(i)} onOpen={openTile} />
          ))}
        </div>

        <Letter
          label={content.reasons.letterLabel || 'AND ONE MORE THING'}
          forName={content.herName}
          paragraphs={content.reasons.letter}
          signature={content.yourName && content.yourName !== 'YOUR NAME' ? content.yourName : ''}
        />
      </div>

      {open !== null && (
        <div className="rs__modal" role="dialog" aria-modal="true" onClick={close}>
          <div className="rs__card px-box is-glow" onClick={(e) => e.stopPropagation()}>
            <div className="rs__card-bar">
              <span className="rs__card-no">REASON #{String(open + 1).padStart(3, '0')}</span>
              <span className="topbar__spacer" />
              <button
                type="button"
                className="btn btn--icon btn--ghost"
                onClick={close}
                aria-label="Close"
              >
                <PixelIcon name="close" size={11} />
              </button>
            </div>

            <div className="rs__card-body">
              <span className="rs__card-heart">
                <PixelIcon name="heart" size={26} color="var(--ink)" />
              </span>
              <TypeWriter key={open} text={list[open]} speed={18} className="rs__card-text" />
            </div>

            <div className="rs__card-foot">
              <button
                type="button"
                className="btn btn--icon btn--ink"
                onClick={() => step(-1)}
                aria-label="Previous reason"
              >
                <PixelIcon name="prev" size={12} />
              </button>
              <span className="rs__card-pos">
                {open + 1} / {total}
              </span>
              <button
                type="button"
                className="btn btn--icon btn--ink"
                onClick={() => step(1)}
                aria-label="Next reason"
              >
                <PixelIcon name="next" size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
