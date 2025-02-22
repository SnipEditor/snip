import { transformActiveTexts } from "lib:@snip/helpers";

function escapeText(text: string): string {
    return text.replace(/[\\"']/g, '\\$&');
}

export default async function escape_text() {
    await transformActiveTexts((text: string) => {
        try {
            return escapeText(text);
        } catch (e) {
            throw new Error('Invalid input for escaping');
        }
    });
}