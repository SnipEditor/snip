(function() {
    class Selection {
        private readonly editor: Editor
        private readonly anchor: number
        private readonly head: number
        private text: string|undefined

        constructor(editor: Editor, anchor: number, head: number, text?: string) {
            this.editor = editor
            this.anchor = anchor
            this.head = head
            this.text = text
        }

        public getAnchor(): number {
            return this.anchor
        }

        public getHead(): number {
            return this.head
        }

        public getStart(): number {
            return this.anchor < this.head ? this.anchor : this.head
        }

        public getEnd(): number {
            return this.anchor < this.head ? this.head : this.anchor
        }

        public async getText(): Promise<string> {
            if (this.text === undefined) {
                this.text = await this.editor.getPartialText(this.anchor, this.head)
            }
            return this.text
        }
    }
    class SelectionState {
        private readonly selections: Selection[]
        private readonly mainSelectionIndex: number

        constructor(mainSelectionIndex: number, selections: Selection[]) {
            this.mainSelectionIndex = mainSelectionIndex
            this.selections = selections
        }

        public getMainSelection(): Selection {
            return this.selections[this.mainSelectionIndex]
        }

        public hasSelection(): boolean {
            return this.selections.some(selection => selection.getStart() !== selection.getEnd())
        }

        public getSelections(): Selection[] {
            return [...this.selections]
        }
    }

    interface SelectionReplacement {
        index: number
        text: string
    }

    class Editor {
        public getFullText(): Promise<string> {
            // @ts-ignore
            return Promise.resolve(globalThis.editorMock.fullText)
        }

        public setFullText(text: string) {
            // @ts-ignore
            globalThis.editorMock.fullText = text
            return Promise.resolve()
        }

        public setError(error: string) {
            // @ts-ignore
            globalThis.editorMock.error = error
            return Promise.resolve()
        }

        public getPartialText(start: number, end: number): Promise<string> {
            return Promise.resolve(
                // @ts-ignore
                globalThis.editorMock.fullText.substring(start, end)
            )
        }

        public getSelectionState(): Promise<SelectionState> {
            
            return Promise.resolve(new SelectionState(0, [new Selection(this, 0, 0, undefined)]))
        }

        public replaceSelections(replacements: SelectionReplacement[]): Promise<void> {
            // No op, not supported in mock
            return Promise.resolve()
        }
    }
    // @ts-ignore
    globalThis.Editor = new Editor()
})()