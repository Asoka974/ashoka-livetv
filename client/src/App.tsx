import React, { useEffect, useState, useRef } from "react";
import VideoPlayer from "./components/VideoPlayer";
import CommentsPanel from "./components/CommentsPanel";
import Register from "./components/Register";
import Login from "./components/Login";
import VideoLibrary from "./components/VideoLibrary";
import UploadVideo from "./components/UploadVideo";
import { io, Socket } from "socket.io-client";
import { LogOut, Home, Film, Share2 } from "lucide-react";

let globalSocket: Socket | null = null;

function getSocket() {
  if (!globalSocket) {
    globalSocket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }
  return globalSocket;
}

export type Stamp = {
  id: string;
  videoId: string;
  time: number;
  text: string;
  author: string;
  createdAt?: string;
};

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number;
  author: string;
  userId: string;
  createdAt: string;
}

export default function App() {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [currentView, setCurrentView] = useState<"library" | "player">("library");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
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
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            localStorage.removeItem("email");
          }
        } catch (err) {
          console.error("Erreur de vérification:", err);
        }
      }

      setIsAuthenticating(false);
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!user || !selectedVideo) return;

    async function fetchStamps() {
      try {
        const url = `/api/stamps?videoId=${selectedVideo.id}`;
        const res = await fetch(url);
        const data = await res.json();
        setStamps(data);
      } catch (err) {
        console.error("❌ Error fetching stamps:", err);
      }
    }

    fetchStamps();

    const handleStampCreated = (stamp: Stamp) => {
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

  function handleCreateStamp(payload: Omit<Stamp, "id">) {
    socket.emit("new-stamp", payload);
  }

  function handleAuthSuccess(userData: { id?: string; username: string; email: string; token: string }) {
    setUser({ 
      id: userData.id || "", 
      username: userData.username, 
      email: userData.email 
    });
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
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

  function handleSelectVideo(video: Video) {
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
    if (!selectedVideo) return;
    
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
    } else {
      // Fallback pour navigateurs qui ne supportent pas navigator.share
      navigator.clipboard.writeText(shareUrl);
      alert("Lien copié dans le presse-papiers !");
    }
  }

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === "register") {
      return (
        <Register
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setAuthView("login")}
        />
      );
    }

    return (
      <Login
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={() => setAuthView("register")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">📺</span>
            </div>
            <h1 className="text-2xl font-bold">Ashoka LiveTV</h1>
            
            <nav className="hidden md:flex items-center gap-2 ml-8">
              <button
                onClick={handleBackToLibrary}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === "library"
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Film size={18} />
                Bibliothèque
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {currentView === "player" && selectedVideo && (
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                title="Partager ce live"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">Partager</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold hidden sm:inline">
                👤 {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Se déconnecter"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {currentView === "library" ? (
          <VideoLibrary
            onSelectVideo={handleSelectVideo}
            onOpenUpload={() => setShowUpload(true)}
            currentUserId={user.id}
          />
        ) : selectedVideo ? (
          <div>
            <button
              onClick={handleBackToLibrary}
              className="mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Home size={18} />
              Retour à la bibliothèque
            </button>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <VideoPlayer
                  src={selectedVideo.url}
                  videoId={selectedVideo.id}
                  stamps={stamps}
                  onCreateStamp={handleCreateStamp}
                  username={user.username}
                />
              </div>
              <div>
                <CommentsPanel stamps={stamps} />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {showUpload && (
        <UploadVideo
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
