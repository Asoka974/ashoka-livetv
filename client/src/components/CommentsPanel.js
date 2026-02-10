import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Heart, MessageCircle, Flag } from "lucide-react";
export default function CommentsPanel({ stamps }) {
    const [likedStamps, setLikedStamps] = useState(new Set());
    function formatTime(t) {
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = Math.floor(t % 60);
        return h > 0
            ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
            : `${m}:${s.toString().padStart(2, "0")}`;
    }
    function seek(stamp) {
        const evt = new CustomEvent("seek-to", { detail: stamp.time });
        window.dispatchEvent(evt);
    }
    function toggleLike(id) {
        const newLikes = new Set(likedStamps);
        if (newLikes.has(id)) {
            newLikes.delete(id);
        }
        else {
            newLikes.add(id);
        }
        setLikedStamps(newLikes);
    }
    return (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 h-full flex flex-col", children: [_jsxs("h3", { className: "font-bold text-lg mb-3 text-gray-900 dark:text-white", children: ["Commentaires (", stamps.length, ")"] }), _jsxs("div", { className: "space-y-2 flex-1 overflow-y-auto", children: [stamps.length === 0 && (_jsxs("div", { className: "text-center text-gray-500 dark:text-gray-400 py-8", children: [_jsx(MessageCircle, { size: 32, className: "mx-auto mb-2 opacity-50" }), _jsx("p", { children: "Aucun commentaire pour le moment" })] })), stamps.map((s) => (_jsxs("div", { className: "animate-fade-in p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 group", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("button", { onClick: () => seek(s), className: "text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline", children: formatTime(s.time) }), _jsxs("div", { className: "opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity", children: [_jsx("button", { onClick: () => toggleLike(s.id), className: `p-1 rounded ${likedStamps.has(s.id)
                                                    ? "text-red-500"
                                                    : "text-gray-400 hover:text-red-500"} transition-colors`, children: _jsx(Heart, { size: 14, fill: likedStamps.has(s.id) ? "currentColor" : "none" }) }), _jsx("button", { className: "p-1 rounded text-gray-400 hover:text-orange-500 transition-colors", children: _jsx(Flag, { size: 14 }) })] })] }), _jsx("p", { className: "text-sm text-gray-800 dark:text-gray-100 mb-1", children: s.text }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: s.author || "Anonyme" })] }, s.id)))] })] }));
}
