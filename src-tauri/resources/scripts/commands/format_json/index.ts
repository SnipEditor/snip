(async function() {
    const source = await Editor.getFullText()
    let jsonData
    try {
        jsonData = JSON.parse(source)
    } catch {
        await Editor.setError('Invalid JSON')
        return
    }
    const result = JSON.stringify(jsonData, null, 2)
    await Editor.setFullText(result)
})()