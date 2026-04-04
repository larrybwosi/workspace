"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Toggle theme" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8" aria-label="Toggle theme">
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  )
}
