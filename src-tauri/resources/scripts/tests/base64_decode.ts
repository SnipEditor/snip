import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import base64_decode from "../commands/base64_decode";

Deno.test("base64_decode should decode Base64 text", async () => {
    const input = "SGVsbG8sIHdvcmxkIQ==";
    const expectedOutput = "Hello, world!";

    await expectOutputForInput(base64_decode, input, expectedOutput);
});

Deno.test("base64_decode should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(base64_decode, input, expectedOutput);
});