import { transformActiveTexts } from "lib:@snip/helpers";
import he from "lib:he";

export default async function html_encode_all() {
    await transformActiveTexts((text: string) => {
        try {
            return he.encode(text, { useNamedReferences: true, encodeEverything: true });
        } catch (e) {
            throw new Error('Invalid input for HTML encoding');
        }
    });
}