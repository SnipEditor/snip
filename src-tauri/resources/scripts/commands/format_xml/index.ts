import { transformActiveTexts } from "lib:@snip/helpers";

function formatXml(xml: string): string {
    const PADDING = ' '.repeat(2); // set desired indentation
    const reg = /(>)(<)(\/*)/g;
    let pad = 0;
    return xml.replace(reg, '$1\r\n$2$3')
        .split('\r\n')
        .map((line) => {
            let indent = 0;
            if (line.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (line.match(/^<\/\w/)) {
                if (pad !== 0) {
                    pad -= 1;
                }
            } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }

            const padding = PADDING.repeat(pad);
            pad += indent;
            return padding + line;
        })
        .join('\r\n');
}

export default async function format_xml() {
    await transformActiveTexts((text: string) => {
        try {
            return formatXml(text);
        } catch (e) {
            throw new Error('Invalid XML');
        }
    });
}