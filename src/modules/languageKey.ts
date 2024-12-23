import { langs } from "@uiw/codemirror-extensions-langs";
import {useMemo} from "react";

interface Language {
    title: string,
    highlightKey?: keyof typeof langs
}

export const languages = Object.freeze({
    c: {title: 'C', highlightKey: 'c'} as Language,
    csharp: {title: 'C#', highlightKey: 'csharp'} as Language,
    cpp: {title: 'C++', highlightKey: 'cpp'} as Language,
    css: {title: 'Css', highlightKey: 'css'} as Language,
    dockerfile: {title: 'Dockerfile', highlightKey: 'dockerfile'} as Language,
    go: {title: 'Go', highlightKey: 'go'} as Language,
    html: {title: 'Html', highlightKey: 'html'} as Language,
    java: {title: 'Java', highlightKey: 'java'} as Language,
    jsx: {title: 'Javascript', highlightKey: 'jsx'} as Language,
    json: {title: 'Json', highlightKey: 'json'} as Language,
    kotlin: {title: 'Kotlin', highlightKey: 'kotlin'} as Language,
    markdown: {title: 'Markdown', highlightKey: 'markdown'} as Language,
    php: {title: 'Php', highlightKey: 'php'} as Language,
    protobuf: {title: 'Protobuf', highlightKey: 'protobuf'} as Language,
    python: {title: 'Python', highlightKey: 'python'} as Language,
    rust: {title: 'Rust', highlightKey: 'rust'} as Language,
    sass: {title: 'sass', highlightKey: 'sass'} as Language,
    shell: {title: 'Shell', highlightKey: 'shell'} as Language,
    sql: {title: 'SQL', highlightKey: 'sql'} as Language,
    swift: {title: 'Swift', highlightKey: 'swift'} as Language,
    text: {title: 'Plain Text'} as Language,
    typescript: {title: 'Typescript', highlightKey: 'typescript'} as Language,
    xml: {title: 'Xml', highlightKey: 'xml'} as Language,
    yaml: {title: 'Yaml', highlightKey: 'yaml'} as Language,
})

export function useSortedLanguages() {
    return useMemo(() => {
        return Object.entries(languages).sort((a, b) => a[1].title.localeCompare(b[1].title))
    }, [])
}

export type LanguageKey = keyof typeof languages
