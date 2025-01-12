import React from 'react'
import ReactDOM from 'react-dom/client'
import Settings from '../containers/Settings.tsx'
import SettingsProvider from '../components/SettingsProvider.tsx'
import GlobalThemeDataSwitcher from '../components/GlobalThemeDataSwitcher.tsx'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <GlobalThemeDataSwitcher>
        <Settings />
      </GlobalThemeDataSwitcher>
    </SettingsProvider>
  </React.StrictMode>,
)
