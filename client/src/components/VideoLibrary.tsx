import React, { useEffect, useState } from "react";
import { Play, Clock, User, Upload as UploadIcon, Trash2 } from "lucide-react";

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

interface VideoLibraryProps {
  onSelectVideo: (video: Video) => void;
  onOpenUpload: () => void;
  currentUserId?: string;
}

export default function VideoLibrary({
  onSelectVideo,
  onOpenUpload,
  currentUserId,
}: VideoLibraryProps) {
  const [videos, setVideos] = useState<Video[]>([]);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(videoId: string) {
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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur de suppression");
    }
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Chargement des vidéos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton upload */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bibliothèque de vidéos</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {videos.length} vidéo{videos.length > 1 ? "s" : ""} disponible
            {videos.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transition-all shadow-lg"
        >
          <UploadIcon size={20} />
          Uploader une vidéo
        </button>
      </div>

      {/* Grille de vidéos */}
      {videos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Play size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune vidéo</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Soyez le premier à partager une vidéo !
          </p>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transition-all"
          >
            <UploadIcon size={20} />
            Uploader ma première vidéo
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer"
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-video bg-gray-900 overflow-hidden"
                onClick={() => onSelectVideo(video)}
              >
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={64} className="text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play size={32} className="text-white ml-1" />
                  </div>
                </div>
                {video.duration > 0 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-white text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3
                  className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                  onClick={() => onSelectVideo(video)}
                >
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    {video.author}
                  </div>
                  <span>{formatDate(video.createdAt)}</span>
                </div>

                {/* Bouton supprimer (seulement pour l'auteur) */}
                {currentUserId === video.userId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(video.id);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
