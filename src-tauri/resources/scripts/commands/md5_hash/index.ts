import { transformActiveTexts } from "lib:@snip/helpers";
// @ts-ignore
import Hashes from "lib:jshashes";

function generateMd5Hash(text: string): string {
    // @ts-ignore
    const md5 = new Hashes.MD5();
    return md5.hex(text);
}

export default async function md5_hash() {
    await transformActiveTexts((text: string) => {
        try {
            const md5Hash = generateMd5Hash(text);
            return `${text}\nMD5 Hash: ${md5Hash}`;
        } catch (e) {
            throw new Error('Error generating MD5 hash');
        }
    });
}