import {transformActiveTexts} from "lib:@snip/helpers";

export default async function format_json() {
    await transformActiveTexts((text: string) => {
        try {
            return JSON.stringify(JSON.parse(text), null, 2)
        } catch (e) {
            throw new Error('Invalid JSON')
        }
    })
}