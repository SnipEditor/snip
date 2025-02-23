import { transformActiveTexts } from "lib:@snip/helpers";
// @ts-ignore
import Hashes from "lib:jshashes";

function generateSha1Hash(text: string): string {
    // @ts-ignore
    const sha1 = new Hashes.SHA1();
    return sha1.hex(text);
}

export default async function sha1_hash() {
    await transformActiveTexts((text: string) => {
        try {
            const sha1Hash = generateSha1Hash(text);
            return `${text}\nSHA-1 Hash: ${sha1Hash}`;
        } catch (e) {
            throw new Error('Error generating SHA-1 hash');
        }
    });
}