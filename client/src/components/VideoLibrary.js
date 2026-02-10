import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Play, Clock, User, Upload as UploadIcon, Trash2 } from "lucide-react";
export default function VideoLibrary({ onSelectVideo, onOpenUpload, currentUserId, }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        fetchVideos();
    }, []);
    async function fetchVideos() {
        try {
            const response = await fetch("/api/videos");
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Erreur lors du chargement");
            }
            setVideos(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Erreur serveur");
        }
        finally {
            setLoading(false);
        }
    }
    async function handleDelete(videoId) {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette vidéo ?")) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/videos/${videoId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erreur lors de la suppression");
            }
            // Retirer la vidéo de la liste
            setVideos(videos.filter((v) => v.id !== videoId));
        }
        catch (err) {
            alert(err instanceof Error ? err.message : "Erreur de suppression");
        }
    }
    function formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    }
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement des vid\u00E9os..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400", children: error }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Biblioth\u00E8que de vid\u00E9os" }), _jsxs("p", { className: "text-gray-600 dark:text-gray-400 mt-1", children: [videos.length, " vid\u00E9o", videos.length > 1 ? "s" : "", " disponible", videos.length > 1 ? "s" : ""] })] }), _jsxs("button", { onClick: onOpenUpload, className: "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transition-all shadow-lg", children: [_jsx(UploadIcon, { size: 20 }), "Uploader une vid\u00E9o"] })] }), videos.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl", children: [_jsx(Play, { size: 48, className: "mx-auto text-gray-400 mb-4" }), _jsx("h3", { className: "text-xl font-semibold mb-2", children: "Aucune vid\u00E9o" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: "Soyez le premier \u00E0 partager une vid\u00E9o !" }), _jsxs("button", { onClick: onOpenUpload, className: "inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transition-all", children: [_jsx(UploadIcon, { size: 20 }), "Uploader ma premi\u00E8re vid\u00E9o"] })] })) : (_jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: videos.map((video) => (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer", children: [_jsxs("div", { className: "relative aspect-video bg-gray-900 overflow-hidden", onClick: () => onSelectVideo(video), children: [video.thumbnail ? (_jsx("img", { src: video.thumbnail, alt: video.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(Play, { size: 64, className: "text-white/50" }) })), _jsx("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("div", { className: "w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center", children: _jsx(Play, { size: 32, className: "text-white ml-1" }) }) }), video.duration > 0 && (_jsxs("div", { className: "absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-white text-xs flex items-center gap-1", children: [_jsx(Clock, { size: 12 }), formatDuration(video.duration)] }))] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "font-bold text-lg mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer", onClick: () => onSelectVideo(video), children: video.title }), video.description && (_jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2", children: video.description })), _jsxs("div", { className: "flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(User, { size: 14 }), video.author] }), _jsx("span", { children: formatDate(video.createdAt) })] }), currentUserId === video.userId && (_jsxs("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleDelete(video.id);
                                    }, className: "mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium", children: [_jsx(Trash2, { size: 14 }), "Supprimer"] }))] })] }, video.id))) }))] }));
}
