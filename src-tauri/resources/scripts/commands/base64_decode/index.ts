import { transformActiveTexts } from "lib:@snip/helpers";

export default async function base64_decode() {
    await transformActiveTexts((text: string) => {
        try {
            return atob(text);
        } catch (e) {
            throw new Error('Invalid Base64 input');
        }
    });
}