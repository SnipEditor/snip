import React from 'react'
import ReactDOM from 'react-dom/client'
import CodeEditor from '../containers/CodeEditor.tsx'
import SettingsProvider from '../components/SettingsProvider.tsx'
import GlobalThemeDataSwitcher from '../components/GlobalThemeDataSwitcher.tsx'
import { emit, emitTo } from '@tauri-apps/api/event'
import { platform } from '@tauri-apps/plugin-os'
import { getCurrentWindow } from '@tauri-apps/api/window'

if (platform() === 'windows') {
  document.addEventListener('keydown', (e) => {
    if (!e.ctrlKey) {
      return
    }
    switch(e.key) {
      case 'n':
        void emit('new_window', true)
        break
      case ',':
        void emit('open_settings', true)
        break
      case 'b':
        void emitTo(getCurrentWindow().label, 'open_picker', true)
        break
    }
  })
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <GlobalThemeDataSwitcher>
        <CodeEditor />
      </GlobalThemeDataSwitcher>
    </SettingsProvider>
  </React.StrictMode>,
)
