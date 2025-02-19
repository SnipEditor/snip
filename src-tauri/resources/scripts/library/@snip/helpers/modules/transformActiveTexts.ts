export default async function transformActiveTexts(transformFunc: (text: string) => string | Promise<string>){
    const selectionState = await Editor.getSelectionState()
    if (selectionState.hasSelection()) {
        const selections = selectionState.getSelections()
        const texts = await Promise.all(selections.map(selection => selection.getText())) as string[]
        let replacements
        try {
            replacements = await Promise.all(
                texts.map(async (text, index) => {
                    return ({
                        index,
                        text: await transformFunc(text)
                    })
                })
            )
        } catch (e) {
            await Editor.setError(String(e))
            return
        }
        await Editor.replaceSelections(replacements)
    } else {
        const source = await Editor.getFullText()
        let result: string
        try {
            result = await transformFunc(source)
        } catch (e) {
            await Editor.setError(String(e))
            return
        }
        await Editor.setFullText(result)
    }
}