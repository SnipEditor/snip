import {
  EditorSelection,
  EditorView,
  ReactCodeMirrorRef,
  SelectionRange,
} from '@uiw/react-codemirror'
import { Channel, invoke } from '@tauri-apps/api/core'
import { useCallback, useState } from 'react'

interface GetPartialTextRequestEvent {
  id: number
  event: 'getPartialText'
  data: {
    selectionIndex?: number
    start?: number
    end?: number
  }
}
interface ReplaceSelectionsRequestEvent {
  event: 'replaceSelections'
  data: { index: number; text: string }[]
}

type EditorRequestEvent =
  | {
      id: number
      event: 'getFullText'
    }
  | {
      event: 'setFullText' | 'setError'
      data: string
    }
  | GetPartialTextRequestEvent
  | ReplaceSelectionsRequestEvent

function onGetPartialText(event: GetPartialTextRequestEvent, view: EditorView) {
  let text: string | undefined = undefined
  if (
    event.data.selectionIndex !== undefined &&
    event.data.selectionIndex !== null
  ) {
    const selection = view.state.selection.ranges[event.data.selectionIndex]
    if (selection) {
      const start =
        selection.anchor < selection.head ? selection.anchor : selection.head
      const end =
        selection.anchor < selection.head ? selection.head : selection.anchor
      text = view.state.sliceDoc(start, end)
    }
  } else if (
    event.data.start !== undefined &&
    event.data.end !== undefined &&
    event.data.start !== null &&
    event.data.end !== null
  ) {
    text = view.state.sliceDoc(event.data.start, event.data.end)
  }
  if (text !== undefined) {
    void invoke('reply_editor_request', {
      reply: {
        id: event.id,
        event: 'getPartialText',
        data: text,
      },
    })
  } else {
    void invoke('reply_editor_request', {
      reply: {
        id: event.id,
        error:
          'getPartialText: expects either an available selectionIndex or a combination of start and end index',
      },
    })
  }
}

function onReplaceSelections(
  event: ReplaceSelectionsRequestEvent,
  view: EditorView,
) {
  const transforms: (string | null)[] = new Array<string | null>(
    view.state.selection.ranges.length,
  ).fill(null)
  const changes = event.data.flatMap((replacement) => {
    const selection = view.state.selection.ranges[replacement.index]
    if (!selection) {
      return []
    }

    transforms[replacement.index] = replacement.text

    const from =
      selection.anchor < selection.head ? selection.anchor : selection.head
    const to =
      selection.anchor < selection.head ? selection.head : selection.anchor
    return {
      from,
      to,
      insert: replacement.text,
    }
  })
  let currentShift = 0
  const ranges = transforms.map((text, index) => {
    const previousRange = view.state.selection.ranges[index]
    if (text === null && currentShift === 0) {
      return previousRange
    }
    if (text === null) {
      return SelectionRange.fromJSON({
        anchor: previousRange.anchor + currentShift,
        head: previousRange.head + currentShift,
      })
    }

    const start =
      previousRange.anchor < previousRange.head
        ? previousRange.anchor
        : previousRange.head
    const end =
      previousRange.anchor < previousRange.head
        ? previousRange.head
        : previousRange.anchor
    currentShift += text.length - (end - start)

    return SelectionRange.fromJSON({
      anchor: end + currentShift,
      head: end + currentShift,
    })
  })

  view.dispatch({
    changes,
    selection: EditorSelection.create(ranges, view.state.selection.mainIndex),
  })
}

export default function useScriptCommandRunner(
  editorRef: ReactCodeMirrorRef | null,
) {
  const [scriptState, setScriptState] = useState<{
    running: boolean
    error?: string
  }>({ running: false })

  const triggerCommand = useCallback(
    async (commandId: string) => {
      const currentScriptState = { ...scriptState }
      if (currentScriptState.running || !editorRef || !editorRef?.view) {
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
              },
            })
            break
          case 'getPartialText':
            onGetPartialText(response, editorRef.view!)
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
          case 'replaceSelections':
            onReplaceSelections(response, editorRef.view!)
            break
          case 'setError':
            currentScriptState.error = response.data
            setScriptState({ ...currentScriptState })
            break
        }
      }

      currentScriptState.running = true
      delete currentScriptState.error
      setScriptState({ ...currentScriptState })
      try {
        const selection = editorRef.view.state.selection
        const editorState = {
          selection: {
            mainSelectionIndex: selection.mainIndex,
            selections: selection.ranges.map((range) => {
              const start =
                range.anchor < range.head ? range.anchor : range.head
              const end = range.anchor < range.head ? range.head : range.anchor
              const selectionLength = end - start
              let text: string | undefined = undefined
              if (selectionLength > 0 && selectionLength < 4092) {
                text = editorRef.view?.state?.sliceDoc(start, end)
              }
              return {
                anchor: range.anchor,
                head: range.head,
                text,
              }
            }),
          },
        }
        await invoke('run_script_command', {
          commandId,
          editorRequestChannel,
          editorState,
        })
        currentScriptState.running = false
        setScriptState({ ...currentScriptState })
        console.log('Script ran successfully')
      } catch (e) {
        const error = e as string
        console.warn(`Error running script: ${error}`)
        currentScriptState.running = false
        currentScriptState.error = error
        setScriptState({ ...currentScriptState })
      }
    },
    [scriptState, setScriptState, editorRef],
  )

  return {
    isRunning: scriptState.running,
    error: scriptState.error,
    triggerCommand,
  }
}
