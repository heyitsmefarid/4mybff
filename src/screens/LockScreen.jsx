import { useCallback, useEffect, useRef, useState } from 'react';
import content from '../content.js';
import PixelIcon from '../components/PixelIcon.jsx';
import { useSound } from '../hooks/useSound.jsx';
import './lock.css';

const PIN = String(content.lock.pin);
const LEN = PIN.length;
const MAX_LIVES = 3;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'clr'];

export default function LockScreen({ onUnlock }) {
  const { play } = useSound();
  const [digits, setDigits] = useState('');
  const [status, setStatus] = useState('idle'); // idle | error | success
  const [lives, setLives] = useState(MAX_LIVES);
  const [misses, setMisses] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [message, setMessage] = useState('');
  const unlockRef = useRef(onUnlock);
  unlockRef.current = onUnlock;

  const locked = status === 'success';

  const push = useCallback(
    (d) => {
      if (locked) return;
      setDigits((cur) => {
        if (cur.length >= LEN) return cur;
        play('key');
        return cur + d;
      });
    },
    [locked, play]
  );

  const back = useCallback(() => {
    if (locked) return;
    setDigits((cur) => {
      if (!cur) return cur;
      play('back');
      return cur.slice(0, -1);
    });
  }, [locked, play]);

  const clear = useCallback(() => {
    if (locked) return;
    play('back');
    setDigits('');
  }, [locked, play]);

  /* Check automatically once the last slot fills — with a short beat first so
     she gets to see the digit land before the verdict. */
  useEffect(() => {
    if (digits.length !== LEN || status !== 'idle') return;

    const id = setTimeout(() => {
      if (digits === PIN) {
        play('unlock');
        setStatus('success');
        setMessage(content.lock.success);
        setTimeout(() => unlockRef.current(), 1500);
        return;
      }

      play('error');
      setStatus('error');
      setMisses((m) => m + 1);
      setLives((l) => l - 1);

      setTimeout(() => {
        setDigits('');
        setStatus('idle');
      }, 620);
    }, 340);

    return () => clearTimeout(id);
  }, [digits, status, play]);

  /* Never actually lock her out of her own birthday present: when the hearts
     run out the hint appears for good and the lives quietly come back. */
  useEffect(() => {
    if (misses === 0) return;
    if (lives <= 0) {
      setHinted(true);
      setMessage(content.lock.lockedOut);
      const id = setTimeout(() => setLives(MAX_LIVES), 900);
      return () => clearTimeout(id);
    }
    if (misses >= MAX_LIVES) setHinted(true);
    setMessage(content.lock.wrong);
  }, [misses, lives]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        push(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        back();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clear();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [push, back, clear]);

  const slots = Array.from({ length: LEN }, (_, i) => ({
    value: digits[i] ?? '',
    active: i === digits.length && !locked,
  }));

  return (
    <div className={'screen lock lock--' + status}>
      <div className="screen__inner lock__inner">
        <div className={'lock__icon' + (locked ? ' is-open' : '')}>
          <PixelIcon name="lock" size={40} color={locked ? 'var(--lime)' : 'var(--acc)'} />
        </div>

        <h1 className="lock__prompt glow-acc">{content.lock.prompt}</h1>

        <div className="lock__lives" aria-label={lives + ' tries left'}>
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <PixelIcon
              key={i}
              name="heart"
              size={14}
              color={i < lives ? 'var(--ink)' : 'var(--edge)'}
              className={i < lives ? 'lock__life' : 'lock__life is-lost'}
            />
          ))}
        </div>

        <div className={'lock__slots' + (status === 'error' ? ' is-shaking' : '')}>
          {slots.map((s, i) => (
            <span key={i} className="lock__slot-wrap">
              <span
                className={
                  'lock__slot px-box' +
                  (s.active ? ' is-active' : '') +
                  (s.value ? ' is-filled' : '')
                }
              >
                {s.value || (s.active ? <span className="lock__cursor" /> : '')}
              </span>
              {i === 1 && <span className="lock__sep">/</span>}
            </span>
          ))}
        </div>

        <p className="lock__format">MM &nbsp; / &nbsp; DD</p>

        <div className="lock__status" role="status">
          {locked ? (
            <span className="lock__granted">{content.lock.success}</span>
          ) : (
            <span className={message ? 'lock__error' : 'lock__error is-empty'}>
              {message || ' '}
            </span>
          )}
        </div>

        <div className="lock__pad" aria-hidden={locked}>
          {KEYS.map((k) => {
            if (k === 'del') {
              return (
                <button key={k} type="button" className="btn lock__key lock__key--fn" onClick={back}>
                  <PixelIcon name="arrowLeft" size={12} />
                </button>
              );
            }
            if (k === 'clr') {
              return (
                <button key={k} type="button" className="btn lock__key lock__key--fn" onClick={clear}>
                  <PixelIcon name="close" size={11} />
                </button>
              );
            }
            return (
              <button
                key={k}
                type="button"
                className="btn lock__key"
                onClick={() => push(k)}
                disabled={locked}
              >
                {k}
              </button>
            );
          })}
        </div>

        {hinted && <p className="lock__hint">{content.lock.hint}</p>}
      </div>
    </div>
  );
}
