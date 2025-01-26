(async function() {
    const selectionState = await Editor.getSelectionState()
    try {
        if(selectionState.hasSelection()) {
            const selections = selectionState.getSelections()
            const texts = await Promise.all(selections.map(selection => selection.getText())) as string[]
            await Editor.replaceSelections(texts.map((text, index) => {
                console.log(text)
                return ({
                    index,
                    text: JSON.stringify(JSON.parse(text), null, 2)
                })
            }))
        } else {
            const source = await Editor.getFullText()
            const result = JSON.stringify(JSON.parse(source))
            await Editor.setFullText(result)
        }
        return
    } catch (e) {
        await Editor.setError('Invalid JSON')
        return
    }
})()