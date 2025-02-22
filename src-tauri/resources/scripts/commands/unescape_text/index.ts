import { transformActiveTexts } from "lib:@snip/helpers";

function unescapeText(text: string): string {
    return text.replace(/\\(.)/g, '$1');
}

export default async function unescape_text() {
    await transformActiveTexts((text: string) => {
        try {
            return unescapeText(text);
        } catch (e) {
            throw new Error('Invalid input for unescaping');
        }
    });
}