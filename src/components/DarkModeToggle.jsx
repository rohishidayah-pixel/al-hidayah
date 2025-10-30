// src/components/DarkModeToggle.jsx
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle({ className = "" }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
        setDark(true);
      } else if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setDark(false);
      } else {
        // fallback to system
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.classList.add("dark");
          setDark(true);
        }
      }
    } catch (e) {}
  }, []);

  const toggle = () => {
    try {
      if (document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        setDark(false);
      } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        setDark(true);
      }
    } catch (e) {}
  };

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={toggle}
      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition ${className}`}
      title={dark ? "Mode Terang" : "Mode Gelap"}
    >
      {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
    </button>
  );
}
