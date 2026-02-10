import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { LogIn } from "lucide-react";
export default function Login({ onSuccess, onSwitchToRegister }) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la connexion");
            }
            // Sauvegarder dans localStorage
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);
            onSuccess({
                username: data.user.username,
                email: data.user.email,
                token: data.token,
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Erreur serveur");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md", children: [_jsx("div", { className: "flex items-center justify-center mb-6", children: _jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-2xl flex items-center justify-center", children: _jsx(LogIn, { size: 32, className: "text-white" }) }) }), _jsx("h2", { className: "text-3xl font-bold text-center mb-2 bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent", children: "Connexion" }), _jsx("p", { className: "text-center text-gray-600 dark:text-gray-400 mb-6", children: "Bienvenue sur Ashoka LiveTV" }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300", children: "Email" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500", placeholder: "votre@email.com", required: true, disabled: loading, autoFocus: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300", children: "Mot de passe" }), _jsx("input", { type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), className: "w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500", placeholder: "Votre mot de passe", required: true, disabled: loading })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg", children: loading ? "Connexion..." : "Se connecter" })] }), _jsx("div", { className: "mt-6 text-center", children: _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: ["Pas encore de compte ?", " ", _jsx("button", { onClick: onSwitchToRegister, className: "text-indigo-600 dark:text-indigo-400 font-semibold hover:underline", children: "Cr\u00E9er un compte" })] }) })] }) }));
}
