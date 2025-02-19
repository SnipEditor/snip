import { transformActiveTexts } from "lib:@snip/helpers";

export default async function base64_encode() {
    await transformActiveTexts((text: string) => {
        try {
            return btoa(text);
        } catch (e) {
            throw new Error('Invalid input for Base64 encoding');
        }
    });
}