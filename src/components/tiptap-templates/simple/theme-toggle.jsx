"use client"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"

// --- Icons ---
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon"
import { SunIcon } from "@/components/tiptap-icons/sun-icon"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  // Force light mode by default. User can toggle manually.
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    try {
      document.documentElement.classList.toggle("dark", isDarkMode)
      // also toggle on body to support styles targeting body.dark
      if (document.body) document.body.classList.toggle("dark", isDarkMode)
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode((isDark) => !isDark)

  // debug helper to confirm clicks in dev
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("ThemeToggle mounted, isDarkMode=", isDarkMode)
    }
  }, [])

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      variant="ghost"
      className="text-[#9490b8] dark:text-[#f0eeff]">
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  );
}
