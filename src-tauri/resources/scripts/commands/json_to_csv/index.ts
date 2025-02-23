import papaparse from "lib:papaparse";
import { transformActiveTexts } from "lib:@snip/helpers";

export default async function json_to_csv() {
    await transformActiveTexts((text: string) => {
        try {
            const jsonObject = JSON.parse(text);
            return papaparse.unparse(jsonObject, {newline: '\n'});
        } catch (e) {
            throw new Error('Invalid JSON');
        }
    });
}