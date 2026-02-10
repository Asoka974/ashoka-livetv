import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Upload, X, Film, Loader } from "lucide-react";
export default function UploadVideo({ onUploadSuccess, onClose, }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState("");
    function handleFileChange(e) {
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
    async function handleSubmit(e) {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Erreur serveur");
        }
        finally {
            setUploading(false);
        }
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-lg flex items-center justify-center", children: _jsx(Film, { size: 24, className: "text-white" }) }), _jsx("h2", { className: "text-2xl font-bold", children: "Uploader une vid\u00E9o" })] }), _jsx("button", { onClick: onClose, disabled: uploading, className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50", children: _jsx(X, { size: 24 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-6", children: [error && (_jsx("div", { className: "p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400", children: error })), _jsxs("div", { children: [_jsx("label", { className: "block mb-2 text-sm font-medium", children: "Fichier vid\u00E9o *" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "file", accept: "video/*", onChange: handleFileChange, disabled: uploading, className: "hidden", id: "video-upload" }), _jsx("label", { htmlFor: "video-upload", className: `block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file
                                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                : "border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400"} ${uploading ? "opacity-50 cursor-not-allowed" : ""}`, children: file ? (_jsxs("div", { className: "space-y-2", children: [_jsx(Film, { size: 48, className: "mx-auto text-green-600" }), _jsx("p", { className: "font-semibold text-green-700 dark:text-green-400", children: file.name }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [(file.size / (1024 * 1024)).toFixed(2), " MB"] })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx(Upload, { size: 48, className: "mx-auto text-gray-400" }), _jsx("p", { className: "font-semibold", children: "Cliquez pour s\u00E9lectionner une vid\u00E9o" }), _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "MP4, MOV, AVI, etc. (max 6 GB)" })] })) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block mb-2 text-sm font-medium", children: "Titre *" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), disabled: uploading, className: "w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500", placeholder: "Titre de votre vid\u00E9o...", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block mb-2 text-sm font-medium", children: "Description (optionnelle)" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), disabled: uploading, className: "w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none", rows: 4, placeholder: "D\u00E9crivez votre vid\u00E9o..." })] }), uploading && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: "Upload en cours..." }), _jsxs("span", { children: [uploadProgress, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-gradient-to-r from-indigo-600 to-pink-600 h-2 rounded-full transition-all duration-300", style: { width: `${uploadProgress}%` } }) })] })), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "submit", disabled: uploading || !file, className: "flex-1 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: uploading ? (_jsxs(_Fragment, { children: [_jsx(Loader, { size: 20, className: "animate-spin" }), "Upload en cours..."] })) : (_jsxs(_Fragment, { children: [_jsx(Upload, { size: 20 }), "Uploader la vid\u00E9o"] })) }), _jsx("button", { type: "button", onClick: onClose, disabled: uploading, className: "px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50", children: "Annuler" })] })] })] }) }));
}
