import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
createRoot(document.getElementById('root')).render(_jsx(App, {}));
// Seek handler from comments panel
window.addEventListener('seek-to', (e) => {
    const t = e.detail;
    const v = document.querySelector('video');
    if (v) {
        v.currentTime = t;
        v.play();
    }
});
