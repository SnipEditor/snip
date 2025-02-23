import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import html_encode_all from "../commands/html_encode_all";

Deno.test("html_encode_all should encode all characters to HTML entities", async () => {
    const input = "<div>Hello, world!</div>";
    const expectedOutput = "&lt;&#x64;&#x69;&#x76;&gt;&#x48;&#x65;&#x6C;&#x6C;&#x6F;&comma;&#x20;&#x77;&#x6F;&#x72;&#x6C;&#x64;&excl;&lt;&sol;&#x64;&#x69;&#x76;&gt;";

    await expectOutputForInput(html_encode_all, input, expectedOutput);
});

Deno.test("html_encode_all should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(html_encode_all, input, expectedOutput);
});