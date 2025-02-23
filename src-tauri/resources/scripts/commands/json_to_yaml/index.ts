import { dump } from "lib:js-yaml";
import { transformActiveTexts } from "lib:@snip/helpers";

export default async function json_to_yaml() {
    await transformActiveTexts((text: string) => {
        try {
            const jsonObject = JSON.parse(text);
            return dump(jsonObject);
        } catch (e) {
            throw new Error('Invalid JSON');
        }
    });
}