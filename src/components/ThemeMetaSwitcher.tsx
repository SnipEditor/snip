import { PropsWithChildren, useEffect } from 'react'
import useTheme from '../modules/useTheme.tsx'

export default function ThemeMetaSwitcher({ children }: PropsWithChildren) {
  const theme = useTheme()
  useEffect(() => {
    document.documentElement.style.display = 'none'
    document.documentElement.setAttribute(
      'data-color-scheme',
      theme.isDark ? 'dark' : 'light',
    )
    // trigger reflow so that overflow style is applied
    document.documentElement.style.display = ''
  }, [theme.isDark])
  return children
}
