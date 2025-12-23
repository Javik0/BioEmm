import { Moon, Sun } from '@phosphor-icons/react'
import { Button } from './button'
import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9"
      title={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
    >
      {theme === 'light' ? (
        <Moon size={20} weight="duotone" className="text-muted-foreground hover:text-foreground transition-colors" />
      ) : (
        <Sun size={20} weight="duotone" className="text-muted-foreground hover:text-foreground transition-colors" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
