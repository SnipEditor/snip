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
        private editorHandle: number|undefined

        constructor() {
        }

        private getEditorHandle(): number {
            if (this.editorHandle === undefined) {
                // @ts-ignore
                this.editorHandle = globalThis?._snipInternals?.editorHandle
            }
            if (this.editorHandle === undefined) {
                throw new Error("Editor handle is not yet initialized")
            }
            return this.editorHandle
        }

        public async getFullText(): Promise<string> {
            const editorHandle = this.getEditorHandle()
            // @ts-ignore
            return await Deno.core.ops.snip_op_get_full_text(editorHandle)
        }

        public async setFullText(text: string) {
            const editorHandle = this.getEditorHandle()
            // @ts-ignore
            await Deno.core.ops.snip_op_set_full_text(editorHandle, text)
        }

        public async setError(error: string) {
            const editorHandle = this.getEditorHandle()
            // @ts-ignore
            await Deno.core.ops.snip_op_set_error(editorHandle, error)
        }

        public async getPartialText(start: number, end: number): Promise<string> {
            const editorHandle = this.getEditorHandle()
            // @ts-ignore
            return await Deno.core.ops.snip_op_get_partial_text(editorHandle, start, end)
        }

        public async getSelectionState(): Promise<SelectionState> {
            const editorHandle = this.getEditorHandle()
            // @ts-ignore
            const selectionStateData = await Deno.core.ops.snip_op_get_selection_state(editorHandle)
            const selections = selectionStateData.selections.map((selection: {anchor: number, head: number, text?: string}) => {
                return new Selection(this, selection.anchor, selection.head, selection.text)
            })
            return new SelectionState(selectionStateData.mainSelectionIndex, selections)
        }

        public async replaceSelections(replacements: SelectionReplacement[]): Promise<void> {
            const editorHandle = this.getEditorHandle()
            // @ts-ignore
            await Deno.core.ops.snip_op_replace_selections(editorHandle, replacements)
        }
    }
    // @ts-ignore
    globalThis.Editor = new Editor()


    /**
     * @param {string} data
     * @returns {string}
     */
    function atob(data: string): string {
        // @ts-ignore
        return Deno.core.ops.op_base64_atob(data);
    }

    /**
     * @param {string} data
     * @returns {string}
     */
    function btoa(data: string): string {
        // @ts-ignore
        return Deno.core.ops.op_base64_btoa(data);
    }

    globalThis.atob = atob
    globalThis.btoa = btoa
})()