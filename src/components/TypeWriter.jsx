import { useEffect, useRef, useState } from 'react';
import { useSound } from '../hooks/useSound.jsx';

/** Reveals text one character at a time, with a blinking block caret. */
export function TypeWriter({ text = '', speed = 26, skip = false, onDone, className, style }) {
  const [count, setCount] = useState(0);
  const { play } = useSound();
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setCount(0);
  }, [text]);

  useEffect(() => {
    if (skip) {
      setCount(text.length);
      return;
    }
    if (count >= text.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(id);
  }, [count, text, speed, skip]);

  /* One tick every few characters — every character would be a machine gun. */
  useEffect(() => {
    if (count > 0 && count < text.length && count % 4 === 0) play('type');
  }, [count, text.length, play]);

  useEffect(() => {
    if (text.length > 0 && count >= text.length) doneRef.current?.();
  }, [count, text.length]);

  return (
    <span className={className} style={style}>
      {text.slice(0, count)}
      {count < text.length && <span className="caret" aria-hidden="true" />}
    </span>
  );
}

export default TypeWriter;
