import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import content from '../content.js';
import TopBar from '../components/TopBar.jsx';
import PixelIcon from '../components/PixelIcon.jsx';
import { useSound } from '../hooks/useSound.jsx';
import { assetUrl } from '../lib/util.js';
import './gallery.css';

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
const SLIDE_MS = content.gallery.slideshowMs ?? 1800;
const SPOT_MS = content.gallery.spotlightMs ?? 1900;

/* Entries may be a bare path ('media/x.jpg') or the older { type, src } object.
   Type comes from the extension, so adding a photo is one line and no
   decisions. */
function normalise(entry) {
  const src = typeof entry === 'string' ? entry : entry?.src || '';
  if (!src) return null;
  const type =
    (typeof entry === 'object' && entry.type) || (VIDEO_EXT.test(src) ? 'video' : 'image');
  return { src, type };
}

/* A repeating rhythm of tile sizes, so the grid never reads as a plain table.
   Deterministic — it must not reshuffle between renders. */
const SPANS = [
  'is-tall', '', '', 'is-wide', '', 'is-big', '', 'is-tall', '',
  'is-wide', '', '', 'is-big', '', 'is-tall', '', '', 'is-wide', '', '',
];

/* Stepping by 3 through 5 colours means neighbours never share an accent. */
const ACCENTS = ['var(--acc)', 'var(--ink)', 'var(--gold)', 'var(--violet)', 'var(--lime)'];

const Tile = memo(function Tile({ item, index, onOpen, isLit }) {
  const [failed, setFailed] = useState(false);
  const src = assetUrl(item.src);
  if (failed) return null;

  return (
    <button
      type="button"
      className={'gal__tile ' + SPANS[index % SPANS.length] + (isLit ? ' is-lit' : '')}
      data-i={index}
      style={{
        '--tile-accent': ACCENTS[(index * 3) % ACCENTS.length],
        animationDelay: (index % 10) * 70 + 'ms',
      }}
      onClick={(e) => onOpen(index, e.currentTarget.getBoundingClientRect())}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.setProperty('--mx', '0');
        e.currentTarget.style.setProperty('--my', '0');
      }}
      aria-label={'Open item ' + (index + 1)}
    >
      <span className="gal__frame">
        {item.type === 'video' ? (
          <video
            src={src}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            className="gal__media"
            onError={() => setFailed(true)}
          />
        ) : (
          <img
            src={src}
            alt=""
            className="gal__media"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
        <span className="gal__scan" aria-hidden="true" />
        <span className="gal__glint" aria-hidden="true" />
        {item.type === 'video' && (
          <span className="gal__vbadge" aria-hidden="true">
            <PixelIcon name="play" size={10} color="var(--bg-1)" />
          </span>
        )}
      </span>
    </button>
  );
});

export default function GalleryScreen({ onBack }) {
  const { play } = useSound();
  const items = useMemo(() => (content.gallery.items || []).map(normalise).filter(Boolean), []);
  const [open, setOpen] = useState(null);
  const [slideshow, setSlideshow] = useState(false);
  /* Rect of the clicked tile, consumed exactly once by the FLIP effect. It is
     a ref, not state: clearing state would re-render and re-add the CSS pop
     fallback, which would then run on top of the FLIP. */
  const pendingFlip = useRef(null);
  const [flipped, setFlipped] = useState(false);

  const openRef = useRef(null);
  openRef.current = open;
  const boxRef = useRef(null);

  /* Attract mode: a spotlight walks the grid on its own, so the gallery is
     alive without a mouse — which is the only thing a phone (or DevTools
     device emulation) can ever show. A real hover takes over instantly. */
  const gridRef = useRef(null);
  const visibleRef = useRef(new Set());
  const [lit, setLit] = useState(-1);
  const [pointerHere, setPointerHere] = useState(false);

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const autoOn = open === null && !pointerHere && !reduceMotion && items.length > 1;

  /* Only tiles actually on screen are candidates — lighting one 3000px down
     the page would look like nothing is happening. */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number(e.target.dataset.i);
          if (e.isIntersecting) visibleRef.current.add(i);
          else visibleRef.current.delete(i);
        }
      },
      { threshold: 0.6 }
    );
    for (const el of grid.children) io.observe(el);
    return () => io.disconnect();
  }, [items.length]);

  useEffect(() => {
    if (!autoOn) {
      setLit(-1);
      return;
    }
    const id = setInterval(() => {
      const vis = [...visibleRef.current].sort((a, b) => a - b);
      if (vis.length === 0) return;
      setLit((cur) => {
        const at = vis.indexOf(cur);
        return at === -1 ? vis[0] : vis[(at + 1) % vis.length];
      });
    }, SPOT_MS);
    return () => clearInterval(id);
  }, [autoOn]);

  const close = useCallback(() => {
    play('back');
    setSlideshow(false);
    pendingFlip.current = null;
    setFlipped(false);
    setOpen(null);
  }, [play]);

  const step = useCallback(
    (dir) => {
      setOpen((i) => (i === null ? null : (i + dir + items.length) % items.length));
    },
    [items.length]
  );

  /* Math.random must not live inside a state updater — StrictMode invokes
     updaters twice and would pick two different photos. */
  const shuffle = useCallback(() => {
    play('select');
    if (items.length === 0) return;
    pendingFlip.current = null;
    setFlipped(false);
    const cur = openRef.current;
    let next = Math.floor(Math.random() * items.length);
    if (items.length > 1) {
      while (next === cur) next = Math.floor(Math.random() * items.length);
    }
    setOpen(next);
  }, [items.length, play]);

  /* Re-armed on every change of `open`, so each photo gets a full turn. */
  useEffect(() => {
    if (!slideshow || open === null) return;
    const id = setTimeout(() => step(1), SLIDE_MS);
    return () => clearTimeout(id);
  }, [slideshow, open, step]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') {
        play('move');
        step(1);
      } else if (e.key === 'ArrowLeft') {
        play('move');
        step(-1);
      } else if (e.key === ' ') {
        e.preventDefault();
        play('key');
        setSlideshow((s) => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, step, play]);

  const openTile = useCallback(
    (i, rect) => {
      play('open');
      pendingFlip.current = rect || null;
      setFlipped(Boolean(rect));
      setOpen(i);
    },
    [play]
  );

  /* FLIP: the lightbox is laid out at its final size, then played backwards
     from the tile's rect, so the photo appears to expand out of the grid. */
  useEffect(() => {
    const from = pendingFlip.current;
    pendingFlip.current = null;
    const el = boxRef.current;
    if (open === null || !from || !el || !el.animate) return;
    const to = el.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    el.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`,
          opacity: 0.55,
        },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 340, easing: 'cubic-bezier(.2,.9,.25,1)' }
    );
  }, [open]);

  const current = open === null ? null : items[open];

  return (
    <div className="screen gallery">
      <div className="screen__inner">
        <TopBar title={content.gallery.heading} onBack={onBack}>
          {items.length > 1 && (
            <button
              type="button"
              className="btn btn--icon btn--ghost gal__shuffle"
              onClick={shuffle}
              aria-label="Show a random photo"
              title="Random"
            >
              <PixelIcon name="shuffle" size={13} />
            </button>
          )}
        </TopBar>

        <div
          ref={gridRef}
          className={
            'gal__grid' +
            (items.length < 4 ? ' is-sparse' : '') +
            (autoOn && lit >= 0 ? ' is-auto' : '')
          }
          onPointerEnter={(e) => e.pointerType === 'mouse' && setPointerHere(true)}
          onPointerLeave={() => setPointerHere(false)}
        >
          {items.map((item, i) => (
            <Tile key={item.src} item={item} index={i} onOpen={openTile} isLit={i === lit} />
          ))}
        </div>
      </div>

      {current && (
        <div className="lb" role="dialog" aria-modal="true" onClick={close}>
          <button
            type="button"
            className="btn btn--icon btn--ink lb__nav lb__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              play('move');
              step(-1);
            }}
            aria-label="Previous"
          >
            <PixelIcon name="prev" size={14} />
          </button>

          <div
            ref={boxRef}
            className={'lb__box px-box is-glow' + (flipped ? '' : ' is-popped')}
            onClick={(e) => e.stopPropagation()}
          >
            {current.type === 'video' ? (
              <video
                key={current.src}
                src={assetUrl(current.src)}
                controls
                autoPlay
                playsInline
                className="lb__media"
              />
            ) : (
              /* keyed so the slow drift restarts on every photo */
              <img
                key={current.src}
                src={assetUrl(current.src)}
                alt=""
                className="lb__media lb__media--drift"
              />
            )}
            <span className="lb__scan" aria-hidden="true" />
          </div>

          <button
            type="button"
            className="btn btn--icon btn--ink lb__nav lb__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              play('move');
              step(1);
            }}
            aria-label="Next"
          >
            <PixelIcon name="next" size={14} />
          </button>

          <div className="lb__tools" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn btn--icon btn--ghost"
              onClick={close}
              aria-label="Close"
            >
              <PixelIcon name="close" size={12} />
            </button>

            <button
              type="button"
              className={'btn btn--icon' + (slideshow ? ' btn--gold' : ' btn--ghost')}
              onClick={() => {
                play('key');
                setSlideshow((s) => !s);
              }}
              aria-label={slideshow ? 'Stop slideshow' : 'Start slideshow'}
              title="Slideshow"
            >
              <PixelIcon
                name={slideshow ? 'pause' : 'play'}
                size={12}
                color={slideshow ? 'var(--bg-1)' : undefined}
              />
            </button>

            <button
              type="button"
              className="btn btn--icon btn--ghost"
              onClick={shuffle}
              aria-label="Random photo"
              title="Random"
            >
              <PixelIcon name="shuffle" size={12} />
            </button>
          </div>

          {items.length > 1 && (
            <span
              className={'lb__dots' + (items.length > 24 ? ' is-many' : '')}
              aria-hidden="true"
            >
              {items.map((_, i) => (
                <span key={i} className={'lb__dot' + (i === open ? ' is-on' : '')} />
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
