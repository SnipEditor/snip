import CodeMirror, {
  BasicSetupOptions,
  EditorView,
  Extension,
  ReactCodeMirrorRef,
  ViewUpdate,
} from '@uiw/react-codemirror'
import { langs } from '@uiw/codemirror-extensions-langs'
import { useCallback, useMemo, useState } from 'react'
import { platform } from '@tauri-apps/plugin-os'
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

const currentPlatform = platform()
const scriptStatusShortcutText = `Press ${currentPlatform === 'macos' ? '⌘' : 'Ctrl'}+B to start an action`

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

  const extensions = useMemo(() => {
    const extensions: Extension[] = []
    if (settings.wrap_lines) {
      extensions.push(EditorView.lineWrapping)
    }
    if (languages[currentLanguage].highlightKey) {
      extensions.push(langs[languages[currentLanguage].highlightKey]())
    }
    return extensions
  }, [settings.wrap_lines, currentLanguage])

  const theme = useTheme()

  const sortedLanguages = useSortedLanguages()
  const { isOpen: scriptSelectorIsOpen, close: closeScriptSelector } =
    useScriptCommandSelector()

  const [editorRef, setEditorRef] = useState<ReactCodeMirrorRef | null>()
  const onRunScript = useCallback(
    (scriptId: string) => {
      if (!editorRef) {
        return
      }
      useScriptCommandRunner(scriptId, editorRef)
    },
    [editorRef],
  )

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
        />
      </div>
      <div
        className="grid grid-cols-3 p-2"
        style={{
          backgroundColor: theme.background,
        }}
      >
        <div className="m-0">
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
        <div className="m-0 text-center">
          <span
            style={{
              backgroundColor: theme.backgroundHighlight,
              color: theme.textColor,
            }}
          >
            {scriptSelectorIsOpen
              ? 'Select your action'
              : scriptStatusShortcutText}
          </span>
        </div>
        <div
          className="m-0 text-right"
          style={{
            color: theme.textColor,
          }}
        >
          {cursorPosLine}:{cursorPosCh + 1}
        </div>
      </div>
      {scriptSelectorIsOpen && (
        <SearchOverlay
          onClose={closeScriptSelector}
          onRunScript={onRunScript}
        />
      )}
    </div>
  )
}

export default CodeEditor
