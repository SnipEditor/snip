import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import html_encode from "../commands/html_encode";

Deno.test("html_encode should encode text to HTML entities", async () => {
    const input = "<div>Hello, world!</div>";
    const expectedOutput = "&lt;div&gt;Hello, world!&lt;/div&gt;";

    await expectOutputForInput(html_encode, input, expectedOutput);
});

Deno.test("html_encode should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(html_encode, input, expectedOutput);
});