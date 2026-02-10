import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import VideoPlayer from "./components/VideoPlayer";
import CommentsPanel from "./components/CommentsPanel";
import Register from "./components/Register";
import Login from "./components/Login";
import VideoLibrary from "./components/VideoLibrary";
import UploadVideo from "./components/UploadVideo";
import { io } from "socket.io-client";
import { LogOut, Home, Film, Share2 } from "lucide-react";
let globalSocket = null;
function getSocket() {
    if (!globalSocket) {
        globalSocket = io("http://localhost:3000", {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });
    }
    return globalSocket;
}
export default function App() {
    const [stamps, setStamps] = useState([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const [user, setUser] = useState(null);
    const [authView, setAuthView] = useState("login");
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [currentView, setCurrentView] = useState("library");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const socket = useRef(getSocket()).current;
    useEffect(() => {
        async function checkAuth() {
            const token = localStorage.getItem("token");
            const username = localStorage.getItem("username");
            const email = localStorage.getItem("email");
            if (token && username && email) {
                try {
                    const response = await fetch("/api/auth/me", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUser({ id: data.user.id, username, email });
                    }
                    else {
                        localStorage.removeItem("token");
                        localStorage.removeItem("username");
                        localStorage.removeItem("email");
                    }
                }
                catch (err) {
                    console.error("Erreur de vérification:", err);
                }
            }
            setIsAuthenticating(false);
        }
        checkAuth();
    }, []);
    useEffect(() => {
        if (!user || !selectedVideo)
            return;
        async function fetchStamps() {
            try {
                const url = `/api/stamps?videoId=${selectedVideo.id}`;
                const res = await fetch(url);
                const data = await res.json();
                setStamps(data);
            }
            catch (err) {
                console.error("❌ Error fetching stamps:", err);
            }
        }
        fetchStamps();
        const handleStampCreated = (stamp) => {
            if (stamp.videoId === selectedVideo.id) {
                setStamps((prev) => [...prev, stamp]);
            }
        };
        socket.on("stamp-created", handleStampCreated);
        socket.on("connect", () => setSocketConnected(true));
        socket.on("disconnect", () => setSocketConnected(false));
        return () => {
            socket.off("stamp-created", handleStampCreated);
        };
    }, [socket, selectedVideo, user]);
    function handleCreateStamp(payload) {
        socket.emit("new-stamp", payload);
    }
    function handleAuthSuccess(userData) {
        setUser({
            id: userData.id || "",
            username: userData.username,
            email: userData.email
        });
    }
    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        }
        catch (err) {
            console.error("Erreur de déconnexion:", err);
        }
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        setUser(null);
        setStamps([]);
        setSelectedVideo(null);
        setCurrentView("library");
    }
    function handleSelectVideo(video) {
        setSelectedVideo(video);
        setCurrentView("player");
        setStamps([]);
    }
    function handleBackToLibrary() {
        setCurrentView("library");
        setSelectedVideo(null);
        setStamps([]);
    }
    function handleUploadSuccess() {
        setShowUpload(false);
        setCurrentView("library");
    }
    function handleShare() {
        if (!selectedVideo)
            return;
        const shareUrl = `${window.location.origin}/?video=${selectedVideo.id}`;
        if (navigator.share) {
            navigator.share({
                title: selectedVideo.title,
                text: `Regardez "${selectedVideo.title}" sur Ashoka LiveTV`,
                url: shareUrl,
            }).catch(() => {
                // Fallback si le partage échoue
                navigator.clipboard.writeText(shareUrl);
                alert("Lien copié dans le presse-papiers !");
            });
        }
        else {
            // Fallback pour navigateurs qui ne supportent pas navigator.share
            navigator.clipboard.writeText(shareUrl);
            alert("Lien copié dans le presse-papiers !");
        }
    }
    if (isAuthenticating) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Chargement..." })] }) }));
    }
    if (!user) {
        if (authView === "register") {
            return (_jsx(Register, { onSuccess: handleAuthSuccess, onSwitchToLogin: () => setAuthView("login") }));
        }
        return (_jsx(Login, { onSuccess: handleAuthSuccess, onSwitchToRegister: () => setAuthView("register") }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors", children: [_jsx("header", { className: "bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 py-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold", children: "\uD83D\uDCFA" }) }), _jsx("h1", { className: "text-2xl font-bold", children: "Ashoka LiveTV" }), _jsx("nav", { className: "hidden md:flex items-center gap-2 ml-8", children: _jsxs("button", { onClick: handleBackToLibrary, className: `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${currentView === "library"
                                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-700"}`, children: [_jsx(Film, { size: 18 }), "Biblioth\u00E8que"] }) })] }), _jsxs("div", { className: "flex items-center gap-4", children: [currentView === "player" && selectedVideo && (_jsxs("button", { onClick: handleShare, className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors", title: "Partager ce live", children: [_jsx(Share2, { size: 18 }), _jsx("span", { className: "hidden sm:inline", children: "Partager" })] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm font-semibold hidden sm:inline", children: ["\uD83D\uDC64 ", user.username] }), _jsx("button", { onClick: handleLogout, className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", title: "Se d\u00E9connecter", children: _jsx(LogOut, { size: 18 }) })] })] })] }) }), _jsx("main", { className: "max-w-7xl mx-auto px-6 py-8", children: currentView === "library" ? (_jsx(VideoLibrary, { onSelectVideo: handleSelectVideo, onOpenUpload: () => setShowUpload(true), currentUserId: user.id })) : selectedVideo ? (_jsxs("div", { children: [_jsxs("button", { onClick: handleBackToLibrary, className: "mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline", children: [_jsx(Home, { size: 18 }), "Retour \u00E0 la biblioth\u00E8que"] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-6", children: [_jsx("div", { className: "md:col-span-2", children: _jsx(VideoPlayer, { src: selectedVideo.url, videoId: selectedVideo.id, stamps: stamps, onCreateStamp: handleCreateStamp, username: user.username }) }), _jsx("div", { children: _jsx(CommentsPanel, { stamps: stamps }) })] })] })) : null }), showUpload && (_jsx(UploadVideo, { onUploadSuccess: handleUploadSuccess, onClose: () => setShowUpload(false) }))] }));
}
