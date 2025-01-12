import { useEffect, useMemo, useState } from 'react'
import { UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

export default function useScriptCommandSelector() {
  const [isOpen, setIsOpen] = useState(false)

  const close = useMemo(() => () => setIsOpen(false), [setIsOpen])

  useEffect(() => {
    let unlistenFn: UnlistenFn | undefined = undefined
    void (async () => {
      const window = getCurrentWebviewWindow()
      unlistenFn = await window.listen('open_picker', () => {
        setIsOpen(true)
      })
    })()

    return () => unlistenFn?.()
  }, [setIsOpen])

  return {
    isOpen,
    close,
  }
}
