import { useCallback, useEffect } from 'react';
import content from '../content.js';
import PixelIcon from '../components/PixelIcon.jsx';
import { useSound } from '../hooks/useSound.jsx';
import './title.css';

/** Letters that ripple, one after the other, like an attract-mode marquee. */
function Wave({ text, className }) {
  return (
    <span className={className}>
      {text.split('').map((ch, i) => (
        <span key={i} className="wave__ch" style={{ animationDelay: i * 80 + 'ms' }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

export default function TitleScreen({ onStart }) {
  const { play } = useSound();

  const start = useCallback(() => {
    play('select');
    onStart();
  }, [play, onStart]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Tab' || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      start();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [start]);

  return (
    <div className="screen title" onClick={start} role="presentation">
      <div className="title__hud">
        <span className="title__hud-item glow-ink">1UP</span>
        <span className="title__hud-item">
          <PixelIcon name="heart" size={10} color="var(--ink)" />
          <PixelIcon name="heart" size={10} color="var(--ink)" />
          <PixelIcon name="heart" size={10} color="var(--ink)" />
        </span>
        <span className="title__hud-item title__hud-item--right glow-acc">HI-SCORE 999999</span>
      </div>

      <div className="screen__inner title__inner">
        <p className="title__badge">
          <PixelIcon name="star" size={10} color="var(--gold)" />
          ARCADE EDITION
          <PixelIcon name="star" size={10} color="var(--gold)" />
        </p>

        <h1 className="title__main">
          <Wave text={content.title.line1} className="title__line title__line--a" />
          <Wave text={content.title.line2} className="title__line title__line--b" />
        </h1>

        <div className="title__name px-box is-glow">
          <PixelIcon name="heart" size={14} color="var(--ink)" />
          <span>{content.herName}</span>
          <PixelIcon name="heart" size={14} color="var(--ink)" />
        </div>

        <p className="title__tagline">{content.title.tagline}</p>

        <button type="button" className="title__start" onClick={start}>
          {content.title.pressStart}
        </button>

        <p className="title__coin">INSERT COIN &middot; 1 CREDIT</p>
      </div>
    </div>
  );
}
