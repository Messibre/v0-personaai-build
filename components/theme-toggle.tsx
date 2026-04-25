"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-9 w-[108px] rounded-full bg-muted/20" />
  }

  const options = [
    { value: "light", icon: Sun, label: "Light mode" },
    { value: "dark", icon: Moon, label: "Dark mode" },
    { value: "system", icon: Monitor, label: "System theme" },
  ] as const

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-full bg-muted/30 border border-[var(--persona-border)]">
      {options.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(value)}
          className={cn(
            "rounded-full size-7 p-0 transition-all duration-300",
            theme === value
              ? "bg-[var(--persona-accent)] text-[var(--persona-bg)] shadow-sm hover:bg-[var(--persona-accent)]/90"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent"
          )}
          aria-label={label}
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </div>
  )
}
