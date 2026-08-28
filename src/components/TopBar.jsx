import PixelIcon from './PixelIcon.jsx';
import { useSound } from '../hooks/useSound.jsx';
import content from '../content.js';

/** Screen header: back to the menu, screen name, optional subtitle + slot. */
export function TopBar({ title, sub, onBack, children }) {
  const { play } = useSound();

  return (
    <header className="topbar">
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => {
          play('back');
          onBack();
        }}
      >
        <PixelIcon name="arrowLeft" size={10} />
        {content.ui.back}
      </button>

      <h1 className="topbar__title glow-gold">{title}</h1>
      <span className="topbar__spacer" />
      {children}
      {sub ? <p className="topbar__sub">{sub}</p> : null}
    </header>
  );
}

export default TopBar;
