import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import minify_xml from "../commands/minify_xml";

Deno.test("minify_xml should minify XML by removing unnecessary whitespace", async () => {
    const input = `<root>
  <child>Hello</child>
  <child>World</child>
</root>`;
    const expectedOutput = `<root><child>Hello</child><child>World</child></root>`;

    await expectOutputForInput(minify_xml, input, expectedOutput);
});

Deno.test("minify_xml should handle empty input", async () => {
    const input = "";
    const expectedOutput = "";

    await expectOutputForInput(minify_xml, input, expectedOutput);
});