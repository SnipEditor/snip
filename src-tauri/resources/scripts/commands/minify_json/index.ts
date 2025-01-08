(async function() {
    const source = await Editor.getFullText()
    const result = JSON.stringify(JSON.parse(source))
    await Editor.setFullText(result)
})()