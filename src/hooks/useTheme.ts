import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Leer del localStorage o usar el preferido del sistema
    const stored = localStorage.getItem('bioemm-theme') as Theme | null
    if (stored) return stored
    
    // Verificar preferencia del sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    
    // Remover la clase anterior y agregar la nueva
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    // Guardar en localStorage
    localStorage.setItem('bioemm-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return { theme, setTheme, toggleTheme }
}
