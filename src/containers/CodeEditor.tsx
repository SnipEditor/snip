import CodeMirror, {
  BasicSetupOptions,
  EditorView,
  Extension,
  ReactCodeMirrorRef,
  ViewUpdate,
} from '@uiw/react-codemirror'
import { langs } from '@uiw/codemirror-extensions-langs'
import { useMemo, useState } from 'react'
import useTheme from '../modules/useTheme.tsx'
import {
  LanguageKey,
  languages,
  useSortedLanguages,
} from '../modules/languageKey.ts'
import { useSettings } from '../context/settings.ts'
import useScriptCommandSelector from '../modules/useScriptCommandSelector.ts'
import SearchOverlay from '../components/SearchOverlay.tsx'
import useScriptCommandRunner from '../modules/useScriptCommandRunner.ts'
import CommandStatus from '../components/CommandStatus.tsx'

function CodeEditor() {
  const settings = useSettings()
  const [cursorPosLine, setCursorPosLine] = useState(1)
  const [cursorPosCh, setCursorPosCh] = useState(0)
  const [currentLanguage, setCurrentLanguage] = useState<LanguageKey>(
    settings.preferred_language,
  )

  const onUpdateHandler = useMemo(
    () => (update: ViewUpdate) => {
      const head = update.state.selection.main.head
      const cursor = update.state.doc.lineAt(head)
      setCursorPosLine(cursor.number)
      setCursorPosCh(head - cursor.from)
    },
    [setCursorPosLine, setCursorPosCh],
  )

  const basicSetup = useMemo<BasicSetupOptions>(
    () => ({
      autocompletion: false,
      tabSize: 2,
    }),
    [],
  )

  const { isOpen: commandPickerIsOpen, close: closeScriptSelector } =
    useScriptCommandSelector()

  const [editorRef, setEditorRef] = useState<ReactCodeMirrorRef | null>(null)
  const {
    isRunning: commandIsRunning,
    error: commandRunError,
    triggerCommand,
  } = useScriptCommandRunner(editorRef)

  const extensions = useMemo(() => {
    const extensions: Extension[] = [EditorView.editable.of(!commandIsRunning)]
    if (settings.wrap_lines) {
      extensions.push(EditorView.lineWrapping)
    }
    if (languages[currentLanguage].highlightKey) {
      extensions.push(langs[languages[currentLanguage].highlightKey]())
    }
    return extensions
  }, [settings.wrap_lines, currentLanguage, commandIsRunning])

  const theme = useTheme()

  const sortedLanguages = useSortedLanguages()

  return (
    <div className="grid size-full grid-rows-[1fr_auto]">
      <div className="h-full overflow-auto overscroll-contain">
        <CodeMirror
          onUpdate={onUpdateHandler}
          extensions={extensions}
          className="h-full cursor-auto"
          height="100%"
          theme={theme.extension}
          basicSetup={basicSetup}
          autoFocus
          ref={setEditorRef}
          readOnly={commandIsRunning}
        />
      </div>
      <div
        className="grid grid-cols-3"
        style={{
          backgroundColor: theme.background,
        }}
      >
        <div className="m-0 p-2">
          <select
            value={currentLanguage}
            onChange={(e) =>
              setCurrentLanguage(e.target.value as unknown as LanguageKey)
            }
          >
            {sortedLanguages.map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.title}
              </option>
            ))}
          </select>
        </div>
        <CommandStatus
          running={commandIsRunning}
          error={commandRunError}
          pickerOpen={commandPickerIsOpen}
        />
        <div className="m-0 p-2 text-right text-theme-700">
          {cursorPosLine}:{cursorPosCh + 1}
        </div>
      </div>
      {commandPickerIsOpen && (
        <SearchOverlay
          onClose={closeScriptSelector}
          onRunCommand={triggerCommand}
        />
      )}
    </div>
  )
}

export default CodeEditor
