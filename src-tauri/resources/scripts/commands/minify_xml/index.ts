import { transformActiveTexts } from "lib:@snip/helpers";

function minifyXml(xml: string): string {
    return xml.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
}

export default async function minify_xml() {
    await transformActiveTexts((text: string) => {
        try {
            return minifyXml(text);
        } catch (e) {
            throw new Error('Invalid XML');
        }
    });
}