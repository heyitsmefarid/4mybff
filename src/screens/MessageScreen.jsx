import { useEffect, useState } from 'react';
import content from '../content.js';
import TopBar from '../components/TopBar.jsx';
import PixelIcon from '../components/PixelIcon.jsx';
import TypeWriter from '../components/TypeWriter.jsx';
import { useSound } from '../hooks/useSound.jsx';
import './message.css';

export default function MessageScreen({ onBack }) {
  const { play } = useSound();
  const pages = content.message.pages;
  const [opened, setOpened] = useState(false);
  const [page, setPage] = useState(0);
  const [typed, setTyped] = useState(false);
  const [skip, setSkip] = useState(false);

  const isLast = page === pages.length - 1;

  /* One tap does the obvious thing: finish typing, or turn the page. */
  const advance = () => {
    if (!typed) {
      setSkip(true);
      return;
    }
    if (isLast) return;
    play('page');
    setPage((p) => p + 1);
    setTyped(false);
    setSkip(false);
  };

  useEffect(() => {
    if (!opened) return;
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="screen msg">
      <div className="screen__inner">
        <TopBar title={content.message.heading} onBack={onBack} />

        {!opened ? (
          <div className="msg__seal-wrap">
            <button
              type="button"
              className="msg__seal"
              onClick={() => {
                play('open');
                setOpened(true);
              }}
            >
              <span className="msg__seal-env px-box is-glow">
                <PixelIcon name="envelope" size={64} color="var(--ink)" />
              </span>
              <span className="msg__seal-label">TAP TO OPEN</span>
              <span className="msg__seal-to">TO: {content.herName}</span>
            </button>
          </div>
        ) : (
          <div className="msg__stage">
            <div className="msg__box px-box is-glow" onClick={advance} role="presentation">
              <div className="msg__bar">
                <span className="msg__avatar">
                  <PixelIcon name="heart" size={16} color="var(--ink)" />
                </span>
                <span className="msg__bar-title">{content.message.boxTitle}</span>
                <span className="topbar__spacer" />
                <span className="msg__page">
                  {page + 1}/{pages.length}
                </span>
              </div>
  
              <div className="msg__body">
                <TypeWriter
                  key={page}
                  text={pages[page]}
                  speed={content.message.typeSpeed ?? 45}
                  skip={skip}
                  onDone={() => setTyped(true)}
                  className="msg__text"
                />
  
                {isLast && typed && content.message.signoff && (
                  <p className="msg__signoff">{content.message.signoff}</p>
                )}
              </div>
  
              <div className="msg__foot">
                <span className="msg__dots" aria-hidden="true">
                  {pages.map((_, i) => (
                    <span key={i} className={'msg__dot' + (i <= page ? ' is-on' : '')} />
                  ))}
                </span>
  
                <span className="topbar__spacer" />
  
                {isLast && typed ? (
                  <button
                    type="button"
                    className="btn btn--ink msg__done"
                    onClick={(e) => {
                      e.stopPropagation();
                      play('back');
                      onBack();
                    }}
                  >
                    <PixelIcon name="heart" size={10} />
                    BACK TO MENU
                  </button>
                ) : (
                  <span className="msg__next">
                    {typed ? 'NEXT' : 'TAP TO SKIP'}
                    <span className={'msg__tri' + (typed ? ' is-ready' : '')}>
                      <PixelIcon name="triDown" size={10} color="var(--gold)" />
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
