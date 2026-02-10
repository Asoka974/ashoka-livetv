#!/usr/bin/env zsh
set -e

ROOT_DIR="$PWD"
echo "Création du projet dans $ROOT_DIR"

# Crée l'arborescence
mkdir -p server/public/videos
mkdir -p client/src/components

# Root package.json (workspace helper)
cat > package.json <<'JSON'
{
  "name": "stream-stamps-proto",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "echo 'Use two terminals: cd server && npm run dev  AND cd client && npm run dev'",
    "start": "cd server && npm start"
  },
  "devDependencies": {}
}
JSON

# Server files
cat > server/package.json <<'JSON'
{
  "name": "stream-server",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon index.js --watch . --ext js,json",
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "lowdb": "^6.0.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
JSON

cat > server/index.js <<'JS'
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Low, JSONFile } = require('lowdb');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// DB (lowdb)
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDB(){
  await db.read();
  db.data = db.data || { stamps: [] };
  await db.write();
}
initDB();

app.use(express.json());
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

app.get('/api/stamps', async (req, res) => {
  const videoId = req.query.videoId || 'sample';
  await db.read();
  const stamps = (db.data.stamps || []).filter(s => s.videoId === videoId);
  res.json(stamps);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('new-stamp', async (payload) => {
    const stamp = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
      ...payload
    };
    await db.read();
    db.data.stamps = db.data.stamps || [];
    db.data.stamps.push(stamp);
    await db.write();
    io.emit('stamp-created', stamp);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
JS

cat > server/db.json <<'JSON'
{
  "stamps": []
}
JSON

# Client (Vite + React + TS) - simplified: TS optional, but keep .tsx
cat > client/package.json <<'JSON'
{
  "name": "stream-client",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.2"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
JSON

cat > client/index.html <<'HTML'
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>Streaming Stamps</title>
    <!-- Optional: Tailwind CDN for quick modern look -->
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50 text-slate-900">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HTML

cat > client/vite.config.ts <<'TS'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
TS

cat > client/tsconfig.json <<'JSON'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
JSON

cat > client/src/main.tsx <<'TSX'
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
TSX

cat > client/src/App.tsx <<'TSX'
import React, { useEffect, useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import CommentsPanel from './components/CommentsPanel';
import { io } from 'socket.io-client';

const socket = io();

export type Stamp = {
  id: string;
  videoId: string;
  time: number;
  text: string;
  author?: string;
  color?: string;
};

export default function App(){
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const videoId = 'sample';

  useEffect(() => {
    fetch(`/api/stamps?videoId=${videoId}`).then(r => r.json()).then(data => setStamps(data));
    socket.on('stamp-created', (stamp: Stamp) => {
      if (stamp.videoId === videoId) setStamps(s => [...s, stamp]);
    });
    return () => { socket.off('stamp-created'); };
  }, []);

  function handleCreateStamp(payload: Omit<Stamp,'id'>){
    socket.emit('new-stamp', payload);
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
          <VideoPlayer
            src="/videos/sample.mp4"
            videoId={videoId}
            stamps={stamps}
            onCreateStamp={handleCreateStamp}
          />
        </div>
        <div>
          <CommentsPanel stamps={stamps} />
        </div>
      </div>
    </div>
  );
}
TSX

cat > client/src/components/VideoPlayer.tsx <<'TSX'
import React, { useRef, useState, useEffect } from 'react';
import type { Stamp } from '../App';

export default function VideoPlayer({ src, videoId, stamps, onCreateStamp }:
  { src: string, videoId: string, stamps: Stamp[], onCreateStamp: (p: Omit<Stamp,'id'>) => void }) {

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setDuration(v.duration || 0);
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
    };
  }, []);

  function handleAddStamp(){
    if (!videoRef.current) return;
    setShowForm(true);
    setText('');
  }

  function submitStamp(){
    const t = videoRef.current?.currentTime || currentTime;
    onCreateStamp({
      videoId,
      time: Math.round(t * 100) / 100,
      text,
      author: 'Viewer'
    });
    setShowForm(false);
  }

  function seekTo(time:number){
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    videoRef.current.play();
  }

  return (
    <div>
      <div className="relative">
        <video ref={videoRef} src={src} controls className="w-full rounded-lg bg-black" />
        <div className="absolute left-0 right-0 bottom-12 px-4 pointer-events-none">
          <div className="relative h-3 bg-slate-200/60 rounded">
            {duration > 0 && stamps.map(s => {
              const percent = Math.max(0, Math.min(100, (s.time / duration) * 100));
              return (
                <button
                  key={s.id}
                  onClick={() => seekTo(s.time)}
                  className="absolute -translate-y-1/2 top-1/2 w-3 h-3 rounded-full border-2 border-white pointer-events-auto"
                  style={{ left: `${percent}%`, backgroundColor: s.color || '#ef4444' }}
                  title={`${s.text} — ${s.time}s`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleAddStamp}
          className="bg-indigo-600 text-white px-3 py-2 rounded shadow hover:bg-indigo-500"
        >
          Add stamp at {Math.round(currentTime)}s
        </button>
        <div className="text-sm text-slate-500">Current: {Math.round(currentTime)}s</div>
      </div>

      {showForm && (
        <div className="mt-3 bg-white/90 p-3 rounded shadow">
          <div className="mb-2 text-sm">Ajouter un commentaire à {Math.round(currentTime)}s</div>
          <textarea className="w-full p-2 rounded border" rows={3} value={text} onChange={e=>setText(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={submitStamp}>Envoyer</button>
            <button className="px-3 py-1 border rounded" onClick={()=>setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
TSX

cat > client/src/components/CommentsPanel.tsx <<'TSX'
import React from 'react';
import type { Stamp } from '../App';

export default function CommentsPanel({ stamps }: { stamps: Stamp[] }) {
  function prettyTime(t:number){
    const s = Math.floor(t % 60).toString().padStart(2,'0');
    const m = Math.floor(t/60);
    return `${m}:${s}`;
  }

  function seek(stamp: Stamp){
    const evt = new CustomEvent('seek-to', { detail: stamp.time });
    window.dispatchEvent(evt);
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Commentaires</h3>
      <div className="space-y-3 max-h-[70vh] overflow-auto">
        {stamps.length === 0 && <div className="text-sm text-slate-500">Aucun commentaire</div>}
        {stamps.map(s => (
          <div key={s.id} className="p-3 rounded border flex gap-3 items-start">
            <div className="text-xs font-mono text-slate-600 w-14">{prettyTime(s.time)}</div>
            <div className="flex-1">
              <div className="text-sm">{s.text}</div>
              <div className="text-xs text-slate-400 mt-1">{s.author || 'Anonyme'}</div>
            </div>
            <button className="text-indigo-600 text-sm" onClick={()=>seek(s)}>Voir</button>
          </div>
        ))}
      </div>
    </div>
  );
}
TSX

cat > client/src/styles.css <<'CSS'
/* Baseline styles; Tailwind CDN is available in index.html for quick styling */
body { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
CSS

# Make files executable and permissions sane
chmod -R u+rw .

echo "Installation des dépendances (cela peut prendre quelques minutes)..."

# Install server deps
echo "Installation: server..."
(cd server && npm install)

# Install client deps
echo "Installation: client..."
(cd client && npm install)

echo "Bootstrap terminé.

Étapes suivantes:

1) Placez un fichier vidéo sample.mp4 dans: server/public/videos/sample.mp4
   (ou changez le chemin dans client/src/App.tsx)

2) Lancer le serveur:
   cd server
   npm run dev
   (ou `npm start` pour production)

3) Lancer le client en dev (dans un autre terminal):
   cd client
   npm run dev

Le front sera servi par Vite (par défaut http://localhost:5173) et le backend sur http://localhost:3000.
Pour tester l'intégration (production-like), build le client:
  cd client && npm run build
puis
  cd server && npm start
Le serveur servira le `dist` côté serveur.

Si vous voulez, j'exécute maintenant les commandes pour vous (je ne peux pas écrire sur votre machine depuis ici). Copiez/collez et exécutez ce script.
"

exit 0
