import { platform } from '@tauri-apps/plugin-os'
import { useMemo } from 'react'
import cn from '../modules/classnames.ts'

const currentPlatform = platform()
const scriptStatusShortcutText = `Press ${currentPlatform === 'macos' ? '⌘' : 'Ctrl'}+B to start a command`

export interface CommandStatusProps {
  pickerOpen?: boolean
  running: boolean
  error?: string | undefined
}

export default function CommandStatus({
  pickerOpen,
  running,
  error,
}: CommandStatusProps) {
  const statusText = useMemo(() => {
    if (pickerOpen) {
      return 'Select a command'
    }
    if (error) {
      return `Error: ${error}`
    }
    if (running) {
      return 'Command is running...'
    }
    return scriptStatusShortcutText
  }, [pickerOpen, running, error])

  const classNames = useMemo(
    () =>
      cn(
        'flex-1 bg-theme-300 rounded-xl m-1 p-1 px-3 justify-center max-w-96 text-theme-700 text-center truncate',
        error && !pickerOpen && 'bg-red-800 text-white',
      ),
    [error, pickerOpen],
  )

  return (
    <div className="flex flex-row justify-center">
      <span className={classNames}>{statusText}</span>
    </div>
  )
}
