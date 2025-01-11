import { MouseEventHandler, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

export interface SearchOverlayProps {
  onClose: () => void
  onRunCommand: (scriptId: string) => void
}

interface Command {
  id: string
  title: string
  description: string
}

interface CommandSearchResult {
  command: Command
  score: number
  matchedIndices: number[]
}

const stopPropagationClickHandler: MouseEventHandler<HTMLDivElement> = (e) => {
  e.stopPropagation()
}

export default function SearchOverlay({
  onClose,
  onRunCommand,
}: SearchOverlayProps) {
  const [matchingScripts, setMatchingScripts] = useState<CommandSearchResult[]>(
    [],
  )

  return (
    <div
      className="absolute flex size-full justify-center"
      onClick={() => onClose()}
    >
      <div
        className="mt-32 flex w-96 flex-col"
        onClick={stopPropagationClickHandler}
      >
        <input
          type="text"
          placeholder="Start typing..."
          className="w-full"
          // onBlur={onClose}
          onKeyUp={(e) => {
            switch (e.key) {
              case 'Escape':
                onClose()
                break
              case 'Enter':
                if (matchingScripts.length > 0) {
                  onRunCommand(matchingScripts[0].command.id)
                  onClose()
                }
                break
              default:
            }
          }}
          onChange={(e) => {
            const searchTerm = e.target.value
            if (!searchTerm) {
              setMatchingScripts([])
              return
            }
            invoke('get_script_commands', { searchTerm: e.target.value })
              .then((scripts) =>
                setMatchingScripts(scripts as CommandSearchResult[]),
              )
              .catch((e) => {
                console.warn('Error while searching for scripts', e)
                setMatchingScripts([])
              })
          }}
          autoFocus
        />
        {matchingScripts.map((searchResult) => (
          <a
            className="h-16 border-2 bg-black"
            onClick={() => {
              onRunCommand(searchResult.command.id)
              onClose()
            }}
          >
            <span>{searchResult.command.title}</span>
            <span>{searchResult.command.description}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
