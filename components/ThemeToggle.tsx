"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function getSystemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getStoredTheme(): "light" | "dark" | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem("theme");
  return v === "light" || v === "dark" ? v : null;
}

function applyTheme(t: "light" | "dark") {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = getStoredTheme();
    const initial = stored ?? (getSystemPrefersDark() ? "dark" : "light");
    setTheme(initial);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggled = theme === "dark";
  const onClick = () => setTheme(toggled ? "light" : "dark");

  return (
    <Button variant="outline" size="icon" aria-label="Toggle theme" onClick={onClick} title={toggled ? "Switch to light" : "Switch to dark"}>
      {toggled ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

