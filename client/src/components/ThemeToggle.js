import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const isDarkMode = localStorage.getItem("theme") === "dark";
        setIsDark(isDarkMode);
        applyTheme(isDarkMode);
    }, []);
    function applyTheme(dark) {
        const root = document.documentElement;
        if (dark) {
            root.setAttribute("data-theme", "dark");
            root.classList.add("dark");
        }
        else {
            root.setAttribute("data-theme", "light");
            root.classList.remove("dark");
        }
        localStorage.setItem("theme", dark ? "dark" : "light");
    }
    function toggle() {
        const newTheme = !isDark;
        setIsDark(newTheme);
        applyTheme(newTheme);
    }
    return (_jsx("button", { onClick: toggle, className: "p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors", title: isDark ? "Light mode" : "Dark mode", children: isDark ? (_jsx(Sun, { size: 20, className: "text-yellow-400" })) : (_jsx(Moon, { size: 20, className: "text-gray-600" })) }));
}
