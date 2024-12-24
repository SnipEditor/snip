import { PropsWithChildren, useEffect, useState } from 'react'
import { Settings, SettingsContext } from '../context/settings.ts'
import { invoke } from '@tauri-apps/api/core'
import { listen, UnlistenFn } from '@tauri-apps/api/event'

export default function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<Settings | undefined>(undefined)

  useEffect(() => {
    let unlistenFn: UnlistenFn | undefined
    void (async () => {
      setSettings(await invoke('get_settings'))

      unlistenFn = await listen<Settings>('settings_update', (event) => {
        console.log('settings_update event')
        setSettings(event.payload)
      })
    })()
    return () => {
      unlistenFn?.()
    }
  }, [setSettings])

  if (!settings) {
    return null
  }
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}
