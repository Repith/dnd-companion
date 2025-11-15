"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Theme</h2>
            <p className="text-sm text-muted-foreground">
              Choose your preferred theme
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`text-sm font-medium ${
                theme === "light" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Light
            </span>

            <button
              onClick={handleThemeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                theme === "dark" ? "bg-stone-600" : "bg-stone-300"
              }`}
              role="switch"
              aria-checked={theme === "dark"}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>

            <span
              className={`text-sm font-medium ${
                theme === "dark" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Dark
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
