import { useCallback, useEffect, useState } from 'react';

/* Hash routing, hand-rolled: it keeps the phone's back button working
   (back returns her to the menu instead of closing the site) without
   pulling in a router dependency. */

const read = () => window.location.hash.replace(/^#\/?/, '').trim() || 'title';

export function useHashRoute() {
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next, { replace = false } = {}) => {
    const target = '#/' + next;
    if (window.location.hash === target) return;
    if (replace) {
      window.history.replaceState(null, '', target);
      setRoute(next);
    } else {
      window.location.hash = target;
    }
  }, []);

  return [route, navigate];
}
