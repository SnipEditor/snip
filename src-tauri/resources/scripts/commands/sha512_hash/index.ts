import { transformActiveTexts } from "lib:@snip/helpers";
// @ts-ignore
import Hashes from "lib:jshashes";

function generateSha512Hash(text: string): string {
    // @ts-ignore
    const sha512 = new Hashes.SHA512();
    return sha512.hex(text);
}

export default async function sha512_hash() {
    await transformActiveTexts((text: string) => {
        try {
            const sha512Hash = generateSha512Hash(text);
            return `${text}\nSHA-512 Hash: ${sha512Hash}`;
        } catch (e) {
            throw new Error('Error generating SHA-512 hash');
        }
    });
}