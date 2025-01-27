import { transformActiveTexts } from "lib:@snip/helpers";

transformActiveTexts((text: string) => {
    try {
        return JSON.stringify(JSON.parse(text))
    } catch (e) {
        throw new Error('Invalid JSON')
    }
})