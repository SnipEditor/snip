import { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { Channel, invoke } from '@tauri-apps/api/core'
import {useCallback, useState} from "react";

type EditorRequestEvent =
  | {
      id: number,
      event: 'getFullText'
    }
  | {
      event: 'setFullText' | 'setError',
      data: string
    }

export default function useScriptCommandRunner(
  editorRef: ReactCodeMirrorRef | null,
) {
  const [scriptState, setScriptState] = useState<{ running: boolean, error?: string }>({ running: false });

  const triggerCommand = useCallback(async (commandId: string) => {
    const currentScriptState = {...scriptState}
    if (currentScriptState.running || !editorRef) {
      return
    }

    const editorRequestChannel = new Channel<EditorRequestEvent>()
    editorRequestChannel.onmessage = (response) => {
      switch (response.event) {
        case 'getFullText':
          void invoke('reply_editor_request', {
            reply: {
              id: response.id,
              event: 'getFullText',
              data: editorRef.view?.state?.doc.toString(),
            }
          })
          break
        case 'setFullText':
          editorRef.view?.dispatch({
            changes: [
              {
                from: 0,
                to: editorRef.view?.state?.doc?.length,
                insert: response.data,
              },
            ],
          })
          break
        case 'setError':
          currentScriptState.error = response.data
          setScriptState({...currentScriptState})
          break

      }
    }

    currentScriptState.running = true
    delete currentScriptState.error
    setScriptState({...currentScriptState})
    try {
      await invoke('run_script_command', {commandId, editorRequestChannel})
      currentScriptState.running = false
      setScriptState({...currentScriptState})
      console.log('Script ran successfully')
    } catch (e) {
      const error = e as string
      console.warn(`Error running script: ${error}`)
      currentScriptState.running = false
      currentScriptState.error = error
      setScriptState({...currentScriptState})
    }
  }, [scriptState, setScriptState, editorRef])

  return {
    isRunning: scriptState.running,
    error: scriptState.error,
    triggerCommand,
  }
}
