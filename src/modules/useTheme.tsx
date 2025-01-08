import { useSettings } from '../context/settings.ts'
import {
  defaultSettingsTokyoNightStorm,
  tokyoNightStorm,
} from '@uiw/codemirror-theme-tokyo-night-storm'
import {
  defaultSettingsTokyoNightDay,
  tokyoNightDay,
} from '@uiw/codemirror-theme-tokyo-night-day'
import { useEffect, useState } from 'react'
import { UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow, Theme } from '@tauri-apps/api/window'

export default function useTheme() {
  const settings = useSettings()
  const [systemTheme, setSystemTheme] = useState<Theme>('light')

  useEffect(() => {
    let unlisten: UnlistenFn | undefined
    void (async () => {
      const window = getCurrentWindow()
      setSystemTheme((await window.theme()) ?? 'light')

      unlisten = await window.onThemeChanged(
        ({ payload: theme }: { payload: Theme }) => {
          setSystemTheme(theme)
        },
      )
    })()

    return () => {
      if (unlisten != null) {
        unlisten()
      }
    }
  }, [])

  const normalizedSystemTheme = systemTheme === 'dark' ? 'Dark' : 'Light'
  const themePreference =
    settings.theme === 'System' ? normalizedSystemTheme : settings.theme
  if (themePreference === 'Dark') {
    return {
      isDark: true,
      extension: tokyoNightStorm,
      background: defaultSettingsTokyoNightStorm.background,
      backgroundHighlight: defaultSettingsTokyoNightStorm.lineHighlight,
      textColor: defaultSettingsTokyoNightStorm.gutterForeground,
    }
  } else {
    return {
      isDark: false,
      extension: tokyoNightDay,
      background: defaultSettingsTokyoNightDay.background,
      backgroundHighlight: defaultSettingsTokyoNightDay.lineHighlight,
      textColor: defaultSettingsTokyoNightDay.gutterForeground,
    }
  }
}
