import { PropsWithChildren, useEffect, useMemo } from 'react'
import useTheme from '../modules/useTheme.tsx'
import getShades from '../modules/getShades.ts'

export default function GlobalThemeDataSwitcher({
  children,
}: PropsWithChildren) {
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

  const css = useMemo(() => {
    if (!theme.background) {
      return ''
    }
    const colorMap = getShades(theme.background, theme.isDark)
    return `
      :root {
        ${Object.entries(colorMap)
          .map(([key, value]) => `--color-theme-${key}: ${value}`)
          .join(';\n')}
      }
    `
  }, [theme])

  return (
    <>
      <style type="text/css">{css}</style>
      {children}
    </>
  )
}
