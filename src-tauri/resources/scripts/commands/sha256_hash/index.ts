import { transformActiveTexts } from "lib:@snip/helpers";
// @ts-ignore
import Hashes from "lib:jshashes";

function generateSha256Hash(text: string): string {
    // @ts-ignore
    const sha256 = new Hashes.SHA256();
    return sha256.hex(text);
}

export default async function sha256_hash() {
    await transformActiveTexts((text: string) => {
        try {
            const sha256Hash = generateSha256Hash(text);
            return `${text}\nSHA-256 Hash: ${sha256Hash}`;
        } catch (e) {
            throw new Error('Error generating SHA-256 hash');
        }
    });
}