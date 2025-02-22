import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import html_decode from "../commands/html_decode";

Deno.test("html_decode should decode HTML entities", async () => {
    const input = "&lt;div&gt;Hello, world!&lt;/div&gt;";
    const expectedOutput = "<div>Hello, world!</div>";

    await expectOutputForInput(html_decode, input, expectedOutput);
});

Deno.test("html_decode should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(html_decode, input, expectedOutput);
});