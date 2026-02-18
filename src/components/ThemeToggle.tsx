import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
    >
      <Sun size={16} weight="duotone" className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon size={16} weight="duotone" className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
