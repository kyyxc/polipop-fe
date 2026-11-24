import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext } from './theme-context.js'

const THEME_STORAGE_KEY = 'polipop-theme'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage tidak tersedia: gunakan preferensi sistem.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // localStorage tidak tersedia: tema tetap aktif selama sesi ini.
    }
  }, [theme])

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme === 'light' || nextTheme === 'dark') {
      setThemeState(nextTheme)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
