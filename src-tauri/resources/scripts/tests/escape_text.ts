import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import escape_text from "../commands/escape_text";

Deno.test("escape_text should escape special characters", async () => {
    const input = `Hello "world"`;
    const expectedOutput = `Hello \\"world\\"`;

    await expectOutputForInput(escape_text, input, expectedOutput);
});

Deno.test("escape_text should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(escape_text, input, expectedOutput);
});