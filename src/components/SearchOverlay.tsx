import { MouseEventHandler, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import cn from '../modules/classnames.ts'

export interface SearchOverlayProps {
  onClose: () => void
  onRunCommand: (scriptId: string) => void | Promise<void>
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
      <div className="mt-32 h-fit w-96" onClick={stopPropagationClickHandler}>
        <input
          type="text"
          placeholder="Start typing..."
          className="w-full rounded-xl border-2 border-theme-600 bg-theme-50 p-2 px-3 text-lg text-theme-950 placeholder:text-theme-600 focus:border-theme-800 focus:outline-none"
          // onBlur={onClose}
          onKeyUp={(e) => {
            switch (e.key) {
              case 'Escape':
                onClose()
                break
              case 'Enter':
                if (matchingScripts.length > 0) {
                  void onRunCommand(matchingScripts[0].command.id)
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
        {matchingScripts.length > 0 && (
          <div className="mt-2 rounded-xl border-2 border-theme-600 bg-theme-50 py-1">
            <div className="max-h-64 snap-y overflow-y-auto">
              {matchingScripts.map((searchResult, index) => {
                const isLast = index === matchingScripts.length - 1
                return (
                  <a
                    className={cn(
                      'block cursor-pointer text-theme-950 hover:bg-theme-200 snap-start',
                      !isLast && 'border-b-[1px] border-theme-600',
                    )}
                    onClick={() => {
                      void onRunCommand(searchResult.command.id)
                      onClose()
                    }}
                  >
                    <div className="flex flex-col px-3 py-1">
                      <span className="text-lg font-bold">
                        {searchResult.command.title}
                      </span>
                      <span className="truncate text-lg italic">
                        {searchResult.command.description} with long text behind
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
