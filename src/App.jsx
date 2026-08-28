import { useCallback, useEffect, useRef, useState } from 'react';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useSound } from './hooks/useSound.jsx';
import { useTheme } from './hooks/useTheme.jsx';
import { CRTOverlay, FloatingHearts, StarField } from './components/Backdrop.jsx';
import PixelIcon from './components/PixelIcon.jsx';
import TitleScreen from './screens/TitleScreen.jsx';
import LockScreen from './screens/LockScreen.jsx';
import MenuScreen from './screens/MenuScreen.jsx';
import GalleryScreen from './screens/GalleryScreen.jsx';
import MessageScreen from './screens/MessageScreen.jsx';
import SongScreen from './screens/SongScreen.jsx';
import ReasonsScreen from './screens/ReasonsScreen.jsx';

const OPEN_ROUTES = ['title', 'lock'];
const HEART_ROUTES = ['title', 'menu', 'message', 'song'];
const UNLOCK_KEY = 'bday.unlocked';

export default function App() {
  const [route, navigate] = useHashRoute();
  const { muted, toggleMute, play } = useSound();
  const { theme, toggleTheme } = useTheme();

  /* Throwing the day/night switch blinks the whole tube once. */
  const [flashKey, setFlashKey] = useState(null);
  const themeSettled = useRef(false);

  useEffect(() => {
    if (!themeSettled.current) {
      themeSettled.current = true;
      return;
    }
    const key = Date.now();
    setFlashKey(key);
    const id = setTimeout(() => setFlashKey(null), 460);
    return () => clearTimeout(id);
  }, [theme]);

  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch {
      return false;
    }
  });

  /* --- the wipe: hold the old screen, close the curtain, swap, open it --- */
  const [display, setDisplay] = useState(route);
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    if (route === display) return;
    setPhase('in');
    const swap = setTimeout(() => {
      setDisplay(route);
      setPhase('out');
      window.scrollTo(0, 0);
    }, 210);
    const settle = setTimeout(() => setPhase('idle'), 450);
    return () => {
      clearTimeout(swap);
      clearTimeout(settle);
    };
  }, [route, display]);

  /* --- gate: no wandering into the site without the PIN --- */
  useEffect(() => {
    if (!unlocked && !OPEN_ROUTES.includes(route)) {
      navigate('lock', { replace: true });
    } else if (unlocked && route === 'lock') {
      navigate('menu', { replace: true });
    }
  }, [route, unlocked, navigate]);

  const handleUnlock = useCallback(() => {
    try {
      sessionStorage.setItem(UNLOCK_KEY, '1');
    } catch {
      /* private browsing — she just re-enters it on refresh */
    }
    setUnlocked(true);
    navigate('menu', { replace: true });
  }, [navigate]);

  const toMenu = useCallback(() => navigate('menu'), [navigate]);

  const render = () => {
    switch (display) {
      case 'lock':
        return <LockScreen onUnlock={handleUnlock} />;
      case 'menu':
        return <MenuScreen onSelect={(key) => navigate(key)} />;
      case 'gallery':
        return <GalleryScreen onBack={toMenu} />;
      case 'message':
        return <MessageScreen onBack={toMenu} />;
      case 'song':
        return <SongScreen onBack={toMenu} />;
      case 'reasons':
        return <ReasonsScreen onBack={toMenu} />;
      default:
        return <TitleScreen onStart={() => navigate(unlocked ? 'menu' : 'lock')} />;
    }
  };

  return (
    <div className="app app__boot">
      <StarField />
      {HEART_ROUTES.includes(display) && <FloatingHearts />}

      {render()}

      {phase !== 'idle' && <div className={'wipe wipe--' + phase} />}
      {flashKey && <div key={flashKey} className="theme-flash" />}

      <div className="hud">
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => {
            play('select');
            toggleTheme();
          }}
          aria-label={theme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
          title={theme === 'day' ? 'Day mode' : 'Night mode'}
        >
          <PixelIcon
            name={theme === 'day' ? 'sun' : 'moon'}
            size={13}
            color={theme === 'day' ? 'var(--gold)' : 'var(--acc)'}
          />
        </button>

        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => {
            if (muted) play('key');
            toggleMute();
          }}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          title={muted ? 'Sound off' : 'Sound on'}
        >
          <PixelIcon name={muted ? 'mute' : 'sound'} size={13} />
        </button>
      </div>

      <CRTOverlay />
    </div>
  );
}
