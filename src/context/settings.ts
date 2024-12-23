import {createContext, useContext} from "react";
import {LanguageKey} from "../modules/languageKey.ts";

export interface Settings {
    theme: 'System' | 'Light' | 'Dark';
    preferred_language: LanguageKey;
    wrap_lines: boolean
}

export const SettingsContext = createContext<Settings|undefined>(undefined)

export function useSettings() {
    const settings = useContext(SettingsContext)
    if (!settings) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return settings
}