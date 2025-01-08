import { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { Channel, invoke } from '@tauri-apps/api/core'

type EditorRequestEvent =
  | {
      event: 'getFullText'
    }
  | {
      event: 'setFullText'
      data: string
    }

export default function useScriptCommandRunner(
  commandId: string,
  editorRef: ReactCodeMirrorRef,
) {
  const editorRequestChannel = new Channel<EditorRequestEvent>()
  editorRequestChannel.onmessage = (response) => {
    switch (response.event) {
      case 'getFullText':
        void invoke('reply_editor_get_full_text', {
          fullText: editorRef.view?.state?.doc.toString(),
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
    }
  }
  invoke('run_script_command', { commandId, editorRequestChannel })
    .then(() => {
      console.log('Script ran successfully')
    })
    .catch((e) => console.log(`Error running script: ${e}`))
}
