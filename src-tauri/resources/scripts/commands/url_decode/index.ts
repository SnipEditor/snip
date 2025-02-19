import { transformActiveTexts } from "lib:@snip/helpers";

export default async function url_decode() {
    await transformActiveTexts((text: string) => {
        try {
            return decodeURIComponent(text);
        } catch (e) {
            throw new Error('Invalid URL');
        }
    });
}