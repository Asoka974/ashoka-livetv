import React, { useRef, useState, useEffect } from "react";
import { MessageCircle, Send } from "lucide-react";
import type { Stamp } from "../App";

export default function VideoPlayer({
  src,
  videoId,
  stamps,
  onCreateStamp,
  username,
}: {
  src: string;
  videoId: string;
  stamps: Stamp[];
  onCreateStamp: (p: Omit<Stamp, "id">) => void;
  username: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setDuration(v.duration || 0);
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
    };
  }, []);

  function handleAddStamp() {
    if (!videoRef.current) return;
    setShowForm(true);
    setText("");
  }

  function submitStamp() {
    if (!text.trim()) {
      alert("Le commentaire ne peut pas être vide");
      return;
    }
    const t = videoRef.current?.currentTime || currentTime;
    onCreateStamp({
      videoId,
      time: Math.round(t * 100) / 100,
      text: text.trim(),
      author: username,
    });
    setShowForm(false);
    setText("");
  }

  function seekTo(time: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    videoRef.current.play();
  }

  function formatTime(t: number) {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4">
      <div className="relative group">
        <video
          ref={videoRef}
          src={src}
          controls
          className="w-full rounded-xl shadow-lg bg-black"
        />

        <div className="absolute left-0 right-0 bottom-16 px-4 pointer-events-none">
          <div className="relative h-2 bg-slate-300/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
            {duration > 0 &&
              stamps.map((s) => {
                const percent = Math.max(
                  0,
                  Math.min(100, (s.time / duration) * 100),
                );
                return (
                  <button
                    key={s.id}
                    onClick={() => seekTo(s.time)}
                    className="absolute -translate-y-1/2 top-1/2 w-4 h-4 rounded-full border-2 border-white pointer-events-auto transition-transform hover:scale-125 shadow-lg"
                    style={{
                      left: `${percent}%`,
                      backgroundColor: "#ec4899",
                    }}
                    title={`${formatTime(s.time)}: ${s.text.slice(0, 30)}`}
                  />
                );
              })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        <button
          onClick={handleAddStamp}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow"
        >
          <MessageCircle size={18} />
          Réagir à {formatTime(currentTime)}
        </button>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {showForm && (
        <div className="animate-slide-in bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border-l-4 border-indigo-600">
          <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Commenter à {formatTime(currentTime)}
          </div>
          <textarea
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Partagez votre avis..."
            autoFocus
          />
          <div className="mt-3 flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              onClick={submitStamp}
            >
              <Send size={16} />
              Valider
            </button>
            <button
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setShowForm(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
