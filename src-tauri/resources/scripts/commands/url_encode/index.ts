import { transformActiveTexts } from "lib:@snip/helpers";

export default async function url_encode() {
    await transformActiveTexts((text: string) => {
        try {
            return encodeURIComponent(text);
        } catch (e) {
            throw new Error('Invalid URL');
        }
    });
}