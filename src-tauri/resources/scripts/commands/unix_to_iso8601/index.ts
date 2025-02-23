import { transformActiveTexts } from "lib:@snip/helpers";

function unixToIso8601(unixTimestamp: string): string {
    const timestamp = parseInt(unixTimestamp, 10);
    if (isNaN(timestamp)) {
        throw new Error('Invalid Unix timestamp');
    }
    return new Date(timestamp * 1000).toISOString();
}

export default async function unix_to_iso8601() {
    await transformActiveTexts((text: string) => {
        try {
            return unixToIso8601(text);
        } catch (e) {
            throw new Error('Invalid Unix timestamp');
        }
    });
}