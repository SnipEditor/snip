import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import unescape_text from "../commands/unescape_text";

Deno.test("unescape_text should unescape special characters", async () => {
    const input = `Hello \\"world\\"`;
    const expectedOutput = `Hello "world"`;

    await expectOutputForInput(unescape_text, input, expectedOutput);
});

Deno.test("unescape_text should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(unescape_text, input, expectedOutput);
});