import React from "react";
import ReactDOM from "react-dom/client";
import Settings from "../containers/Settings.tsx";
import SettingsProvider from "../components/SettingsProvider.tsx";
import ThemeMetaSwitcher from "../components/ThemeMetaSwitcher.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <SettingsProvider>
            <ThemeMetaSwitcher>
                <Settings />
            </ThemeMetaSwitcher>
        </SettingsProvider>
    </React.StrictMode>,
);
