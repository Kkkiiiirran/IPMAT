export type ThemeId = 'forest' | 'ocean' | 'dusk' | 'slate'

export type ThemeOption = {
  id: ThemeId
  label: string
  swatch: string
}

export const THEMES: ThemeOption[] = [
  { id: 'forest', label: 'Forest', swatch: '#1a4a38' },
  { id: 'ocean', label: 'Ocean', swatch: '#0a3a4a' },
  { id: 'dusk', label: 'Dusk', swatch: '#3a2a1a' },
  { id: 'slate', label: 'Slate', swatch: '#1e2a38' },
]

const THEME_KEY = 'mental-maths:theme'

export function getTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    if (raw === 'ocean' || raw === 'dusk' || raw === 'slate' || raw === 'forest') {
      return raw
    }
  } catch {
    /* ignore */
  }
  return 'forest'
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function setTheme(theme: ThemeId): void {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

export function initTheme(): ThemeId {
  const theme = getTheme()
  applyTheme(theme)
  return theme
}
