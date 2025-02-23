import papaparse from "lib:papaparse";
import { transformActiveTexts } from "lib:@snip/helpers";

export default async function csv_to_json() {
    await transformActiveTexts((text: string) => {
        try {
            const result = papaparse.parse(text, { header: true });
            return JSON.stringify(result.data, null, 2);
        } catch (e) {
            throw new Error('Invalid CSV');
        }
    });
}