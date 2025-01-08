(async function() {
    const source = await Editor.getFullText()
    const result = JSON.stringify(JSON.parse(source), null, 2)
    await Editor.setFullText(result)
})()