(function() {
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
    }
    // @ts-ignore
    globalThis.Editor = new Editor()
})()