import {platform} from "@tauri-apps/plugin-os";
import useTheme from "../modules/useTheme.tsx";
import {useMemo} from "react";

const currentPlatform = platform()
const scriptStatusShortcutText = `Press ${currentPlatform === 'macos' ? '⌘' : 'Ctrl'}+B to start a command`

export interface CommandStatusProps {
    pickerOpen?: boolean;
    running: boolean;
    error?: string | undefined;
}

export default function CommandStatus({
    pickerOpen,
    running,
    error
}: CommandStatusProps) {
    const theme = useTheme()

    const statusText = useMemo(() => {
        if (pickerOpen) {
            return 'Select a command'
        }
        if (error) {
            return `Error: ${error}`
        }
        if(running) {
            return 'Command is running...'
        }
        return scriptStatusShortcutText
    }, [pickerOpen, running, error])

    return (
        <span
            style={{
                backgroundColor: theme.backgroundHighlight,
                color: theme.textColor,
            }}
        >
            {statusText}
          </span>
    )
}