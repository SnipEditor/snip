import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import url_decode from "../commands/url_decode";

Deno.test("decode_url should decode a URL", async () => {
    const input = "https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world";
    const expectedOutput = "https://example.com/search?q=hello world";

    await expectOutputForInput(url_decode, input, expectedOutput);
});

Deno.test("decode_url should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(url_decode, input, expectedOutput);
});