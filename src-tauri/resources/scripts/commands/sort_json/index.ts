import { transformActiveTexts } from "lib:@snip/helpers";

function sortKeys(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(sortKeys);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).sort().reduce((result: any, key: string) => {
            result[key] = sortKeys(obj[key]);
            return result;
        }, {});
    }
    return obj;
}

export default async function sort_json() {
    await transformActiveTexts((text: string) => {
        try {
            const jsonObject = JSON.parse(text);
            const sortedObject = sortKeys(jsonObject);
            return JSON.stringify(sortedObject, null, 2);
        } catch (e) {
            throw new Error('Invalid JSON');
        }
    });
}