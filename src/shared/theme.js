// Helper tema global — light/dark mode via class 'dark' di <html>
export function getTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  localStorage.setItem('theme', theme)
}

export function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark')
}
