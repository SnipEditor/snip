import { transformActiveTexts } from "lib:@snip/helpers";
import he from "lib:he";

export default async function html_decode() {
    await transformActiveTexts((text: string) => {
        try {
            return he.decode(text);
        } catch (e) {
            throw new Error('Invalid input for HTML decoding');
        }
    });
}