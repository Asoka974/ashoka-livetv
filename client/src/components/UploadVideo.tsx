import React, { useState } from "react";
import { Upload, X, Film, Loader } from "lucide-react";

interface UploadVideoProps {
  onUploadSuccess: () => void;
  onClose: () => void;
}

export default function UploadVideo({
  onUploadSuccess,
  onClose,
}: UploadVideoProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier que c'est bien une vidéo
      if (!selectedFile.type.startsWith("video/")) {
        setError("Veuillez sélectionner un fichier vidéo");
        return;
      }

      // Vérifier la taille (6 GB max)
      if (selectedFile.size > 6 * 1024 * 1024 * 1024) {
        setError("La vidéo ne doit pas dépasser 6 GB");
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Veuillez sélectionner une vidéo");
      return;
    }

    if (!formData.title.trim()) {
      setError("Le titre est requis");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Non authentifié");
      }

      const uploadFormData = new FormData();
      uploadFormData.append("video", file);
      uploadFormData.append("title", formData.title);
      if (formData.description) {
        uploadFormData.append("description", formData.description);
      }

      // Simuler la progression (Cloudinary ne renvoie pas de vraie progression)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch("/api/videos/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur serveur");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Film size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">Uploader une vidéo</h2>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Zone de drop */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Fichier vidéo *
            </label>
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  file
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400"
                } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {file ? (
                  <div className="space-y-2">
                    <Film size={48} className="mx-auto text-green-600" />
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={48} className="mx-auto text-gray-400" />
                    <p className="font-semibold">
                      Cliquez pour sélectionner une vidéo
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      MP4, MOV, AVI, etc. (max 6 GB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block mb-2 text-sm font-medium">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={uploading}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Titre de votre vidéo..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Description (optionnelle)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={uploading}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
              placeholder="Décrivez votre vidéo..."
            />
          </div>

          {/* Barre de progression */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload en cours...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Uploader la vidéo
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
