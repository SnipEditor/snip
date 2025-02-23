declare global {
    class Selection {
        public getAnchor(): number
        public getHead(): number
        public getStart(): number
        public getEnd(): number
        public getText(): Promise<string>
    }
    class SelectionState {
        public getMainSelection(): Selection
        public hasSelection(): boolean
        public getSelections(): Selection[]
    }
    interface SelectionReplacement {
        index: number
        text: string
    }
    const Editor: {
        getFullText: () => Promise<string>,
        setFullText: (fullText: string) => Promise<void>,
        setError: (error: string) => Promise<void>,
        getPartialText: (start: number, end: number) => Promise<string>
        getSelectionState: () => Promise<SelectionState>
        replaceSelections: (replacements: SelectionReplacement[]) => Promise<void>
    }
}

export {}