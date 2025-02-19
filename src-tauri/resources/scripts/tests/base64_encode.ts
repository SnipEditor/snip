import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import base64_encode from "../commands/base64_encode";

Deno.test("base64_encode should encode text to Base64", async () => {
    const input = "Hello, world!";
    const expectedOutput = "SGVsbG8sIHdvcmxkIQ==";

    await expectOutputForInput(base64_encode, input, expectedOutput);
});

Deno.test("base64_encode should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(base64_encode, input, expectedOutput);
});