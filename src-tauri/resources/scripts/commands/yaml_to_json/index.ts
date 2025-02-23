import { load } from "lib:js-yaml";
import { transformActiveTexts } from "lib:@snip/helpers";

export default async function yaml_to_json() {
    await transformActiveTexts((text: string) => {
        try {
            const jsonObject = load(text) ?? {};
            return JSON.stringify(jsonObject, null, 2);
        } catch (e) {
            throw new Error('Invalid YAML');
        }
    });
}