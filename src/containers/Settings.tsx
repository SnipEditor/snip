import useTheme from '../modules/useTheme.tsx'
import { useSettings } from '../context/settings.ts'
import Dropdown from '../components/Dropdown.tsx'
import { invoke } from '@tauri-apps/api/core'
import { useSortedLanguages } from '../modules/languageKey.ts'
import Checkbox from '../components/Checkbox.tsx'

function Settings() {
  const settings = useSettings()
  const theme = useTheme()

  const sortedLanguages = useSortedLanguages()

  return (
    <div
      className="flex size-full flex-col gap-4 p-8"
      style={{ backgroundColor: theme.background }}
    >
      <Dropdown
        title="Theme"
        value={settings.theme}
        onChange={(newValue) => {
          void invoke('set_theme', { theme: newValue })
        }}
      >
        <option value="Dark">Dark</option>
        <option value="Light">Light</option>
        <option value="System">Use system default</option>
      </Dropdown>
      <Dropdown
        title="Default selected language"
        value={settings.preferred_language}
        onChange={(newValue) => {
          void invoke('set_preferred_language', { preferredLanguage: newValue })
        }}
      >
        {sortedLanguages.map(([key, lang]) => (
          <option key={key} value={key}>
            {lang.title}
          </option>
        ))}
      </Dropdown>
      <Checkbox
        title="Wrap lines"
        value={settings.wrap_lines}
        onChange={(newValue) => {
          void invoke('set_wrap_lines', { wrapLines: newValue })
        }}
      />
    </div>
  )
}

export default Settings
