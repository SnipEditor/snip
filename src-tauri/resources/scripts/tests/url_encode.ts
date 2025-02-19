import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import url_encode from "../commands/url_encode";

Deno.test("encode_url should encode a URL", async () => {
    const input = "https://example.com/search?q=hello world";
    const expectedOutput = "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world";

    await expectOutputForInput(url_encode, input, expectedOutput);
});

Deno.test("encode_url should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(url_encode, input, expectedOutput);
});