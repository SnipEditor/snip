import { transformActiveTexts } from "lib:@snip/helpers";

function dateToUnix(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date string');
    }
    return Math.floor(date.getTime() / 1000).toString();
}

export default async function date_to_unix() {
    await transformActiveTexts((text: string) => {
        try {
            return dateToUnix(text);
        } catch (e) {
            throw new Error('Invalid date string');
        }
    });
}