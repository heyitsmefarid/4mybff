import { useMemo } from 'react';

/* Everything that lives behind the screens: parallax sky, drifting pixel
   hearts, and the CRT glass on top of the whole app.

   The hearts are drawn as a CSS mask filled with `background`, not as a
   coloured SVG data URI — a data URI can't read a theme token, and these need
   to recolour the instant she flips day/night. */

const HEART_COLORS = ['var(--ink)', 'var(--acc)', 'var(--gold)', 'var(--violet)'];

export function StarField() {
  return (
    <div className="starfield" aria-hidden="true">
      <div className="starfield__glow" />
      <div className="starfield__layer starfield__layer--far" />
      <div className="starfield__layer starfield__layer--near" />
    </div>
  );
}

export function FloatingHearts({ count = 14 }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const size = 10 + ((i * 7) % 14);
        return {
          key: i,
          style: {
            left: ((i * 37) % 100) + '%',
            width: size + 'px',
            height: size + 'px',
            background: HEART_COLORS[i % HEART_COLORS.length],
            animationDuration: 14 + ((i * 3) % 13) + 's',
            animationDelay: -((i * 2.4) % 16) + 's',
            '--drift': (i % 2 ? 1 : -1) * (20 + ((i * 11) % 70)) + 'px',
            '--spin': (i % 2 ? 1 : -1) * (10 + ((i * 13) % 40)) + 'deg',
            opacity: 0.5,
          },
        };
      }),
    [count]
  );

  return (
    <div className="hearts" aria-hidden="true">
      {hearts.map((h) => (
        <span key={h.key} className="hearts__one pixel-heart" style={h.style} />
      ))}
    </div>
  );
}

export function CRTOverlay() {
  return (
    <div className="crt" aria-hidden="true">
      <div className="crt__sweep" />
      <div className="crt__lines" />
      <div className="crt__vignette" />
    </div>
  );
}
