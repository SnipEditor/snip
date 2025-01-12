import React from 'react'
import ReactDOM from 'react-dom/client'
import CodeEditor from '../containers/CodeEditor.tsx'
import SettingsProvider from '../components/SettingsProvider.tsx'
import GlobalThemeDataSwitcher from '../components/GlobalThemeDataSwitcher.tsx'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <GlobalThemeDataSwitcher>
        <CodeEditor />
      </GlobalThemeDataSwitcher>
    </SettingsProvider>
  </React.StrictMode>,
)
