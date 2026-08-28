import { useEffect, useRef, useState } from 'react';
import content from '../content.js';
import PixelIcon from '../components/PixelIcon.jsx';
import { useSound } from '../hooks/useSound.jsx';
import './menu.css';

const ITEMS = [
  { key: 'gallery', icon: 'camera', color: 'var(--acc)' },
  { key: 'message', icon: 'envelope', color: 'var(--ink)' },
  { key: 'song', icon: 'note', color: 'var(--gold)' },
  { key: 'reasons', icon: 'heart', color: 'var(--violet)' },
];

export default function MenuScreen({ onSelect }) {
  const { play } = useSound();
  const [index, setIndex] = useState(0);

  /* Enter must read the CURRENT selection. Reading `index` from the effect's
     closure opens the wrong level when arrows are pressed faster than React
     re-renders — down, down, enter would land one row short. */
  const indexRef = useRef(0);
  indexRef.current = index;

  useEffect(() => {
    const onKey = (e) => {
      const down = e.key === 'ArrowDown' || e.key === 's' || e.key === 'S';
      const up = e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W';
      const go = e.key === 'Enter' || e.key === ' ';

      if (down || up) {
        e.preventDefault();
        play('move');
        const next = (indexRef.current + (down ? 1 : -1) + ITEMS.length) % ITEMS.length;
        indexRef.current = next;
        setIndex(next);
      } else if (go) {
        e.preventDefault();
        play('select');
        onSelect(ITEMS[indexRef.current].key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSelect, play]);

  const choose = (key) => {
    play('select');
    onSelect(key);
  };

  return (
    <div className="screen menu">
      <div className="screen__inner menu__inner">
        <header className="menu__head">
          <p className="menu__eyebrow">
            <PixelIcon name="star" size={9} color="var(--gold)" />
            {content.menu.heading}
            <PixelIcon name="star" size={9} color="var(--gold)" />
          </p>
          <h1 className="menu__name glow-ink">{content.herName}</h1>
        </header>

        <nav className="menu__list">
          {ITEMS.map((item, i) => {
            const copy = content.menu.items[item.key];
            const selected = i === index;
            return (
              <button
                key={item.key}
                type="button"
                className={'menu__item px-box' + (selected ? ' is-selected' : '')}
                style={{ '--item-color': item.color }}
                onMouseEnter={() => {
                  if (!selected) play('move');
                  setIndex(i);
                }}
                onFocus={() => setIndex(i)}
                onClick={() => choose(item.key)}
              >
                <span className="menu__cursor" aria-hidden="true">
                  <PixelIcon name="heart" size={13} color="var(--ink)" />
                </span>

                <span className="menu__badge">
                  <PixelIcon name={item.icon} size={22} color={item.color} />
                </span>

                <span className="menu__text">
                  <span className="menu__label">
                    {copy.label.replace('{n}', content.reasons.list.length)}
                  </span>
                  <span className="menu__sub">{copy.sub}</span>
                </span>

                <span className="menu__lv">LV.{i + 1}</span>
                <span className="menu__chev" aria-hidden="true">
                  <PixelIcon name="arrowRight" size={11} color={item.color} />
                </span>
              </button>
            );
          })}
        </nav>

        <footer className="menu__foot">
          <span className="menu__keys">
            <PixelIcon name="triDown" size={9} color="var(--dim)" /> MOVE &nbsp;&middot;&nbsp; ENTER
            SELECT
          </span>
          <p className="menu__note">{content.menu.footer}</p>
        </footer>
      </div>
    </div>
  );
}
