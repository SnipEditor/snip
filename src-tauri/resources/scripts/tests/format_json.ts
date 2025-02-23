import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import format_json from "../commands/format_json";

Deno.test("format_json should format valid JSON", async () => {
    const input = '{"name":"John","age":30,"city":"New York"}';
    const expectedOutput = JSON.stringify(JSON.parse(input), null, 2);

    await expectOutputForInput(format_json, input, expectedOutput);
});

Deno.test("format_json should have error on invalid json", async () => {
    const input = '{"name":"John","age":30,"city":"New York"';

    await expectInputGivesError(format_json, input, "Error: Invalid JSON");
});

Deno.test("format_json should format empty JSON object", async () => {
    const input = '{}';
    const expectedOutput = JSON.stringify(JSON.parse(input), null, 2);

    await expectOutputForInput(format_json, input, expectedOutput);
});

Deno.test("format_json should format nested JSON objects", async () => {
    const input = '{"person":{"name":"John","address":{"city":"New York"}}}';
    const expectedOutput = JSON.stringify(JSON.parse(input), null, 2);

    await expectOutputForInput(format_json, input, expectedOutput);
});

Deno.test("format_json should format array of JSON objects", async () => {
    const input = '[{"name":"John"},{"name":"Jane"}]';
    const expectedOutput = JSON.stringify(JSON.parse(input), null, 2);

    await expectOutputForInput(format_json, input, expectedOutput);
});

Deno.test("format_json should format JSON with special characters", async () => {
    const input = '{"text":"Hello, world! \\n New line."}';
    const expectedOutput = JSON.stringify(JSON.parse(input), null, 2);

    await expectOutputForInput(format_json, input, expectedOutput);
});

Deno.test("format_json should format JSON with different data types", async () => {
    const input = '{"string":"text","number":123,"boolean":true,"null":null}';
    const expectedOutput = JSON.stringify(JSON.parse(input), null, 2);

    await expectOutputForInput(format_json, input, expectedOutput);
});