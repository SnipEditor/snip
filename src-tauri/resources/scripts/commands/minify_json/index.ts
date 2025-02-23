import { transformActiveTexts } from "lib:@snip/helpers";

export default async function minify_json() {
    await transformActiveTexts((text: string) => {
        try {
            return JSON.stringify(JSON.parse(text))
        } catch (e) {
            throw new Error('Invalid JSON')
        }
    })
}