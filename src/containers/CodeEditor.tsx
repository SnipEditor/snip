import CodeMirror, {
  BasicSetupOptions,
  EditorView,
  Extension,
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

  return (
    <div className="size-full grid grid-rows-[1fr_auto]">
      <div className="overflow-auto h-full overscroll-contain">
        <CodeMirror
          onUpdate={onUpdateHandler}
          extensions={extensions}
          className="h-full cursor-auto"
          height="100%"
          theme={theme.extension}
          basicSetup={basicSetup}
          autoFocus
        />
      </div>
      <div
        className="flex justify-between"
        style={{
          backgroundColor: theme.background,
        }}
      >
        <div className="m-2">
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
        <div
          className="m-2"
          style={{
            color: theme.textColor,
          }}
        >
          {cursorPosLine}:{cursorPosCh + 1}
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
