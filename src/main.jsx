import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

/* Base styles must be imported before App: Vite injects stylesheets in module
   evaluation order, and the per-screen sheets need to win over the shared
   .btn / .px-box defaults they override. */
import './styles/theme.css';
import './styles/global.css';

import App from './App.jsx';
import { SoundProvider } from './hooks/useSound.jsx';
import { ThemeProvider } from './hooks/useTheme.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SoundProvider>
        <App />
      </SoundProvider>
    </ThemeProvider>
  </StrictMode>
);
