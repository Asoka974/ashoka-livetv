import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);

// Seek handler from comments panel
window.addEventListener('seek-to', (e:any) => {
  const t = e.detail;
  const v = document.querySelector('video');
  if (v) {
    (v as HTMLVideoElement).currentTime = t;
    (v as HTMLVideoElement).play();
  }
});
