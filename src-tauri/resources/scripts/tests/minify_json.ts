import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import minify_json from "../commands/minify_json";

Deno.test("minify_json should minify valid JSON", async () => {
    const input = `{
        "name": "John",
        "age": 30,
        "city": "New York"
    }`;
    const expectedOutput = '{"name":"John","age":30,"city":"New York"}';

    await expectOutputForInput(minify_json, input, expectedOutput);
});

Deno.test("minify_json should have error on invalid JSON", async () => {
    const input = `{
        "name": "John",
        "age": 30,
        "city": "New York"
    `;

    await expectInputGivesError(minify_json, input, "Error: Invalid JSON");
});

Deno.test("minify_json should handle empty JSON object", async () => {
    const input = `{}`;
    const expectedOutput = '{}';

    await expectOutputForInput(minify_json, input, expectedOutput);
});

Deno.test("minify_json should handle nested JSON objects", async () => {
    const input = `{
        "person": {
            "name": "John",
            "address": {
                "city": "New York"
            }
        }
    }`;
    const expectedOutput = '{"person":{"name":"John","address":{"city":"New York"}}}';

    await expectOutputForInput(minify_json, input, expectedOutput);
});

Deno.test("minify_json should handle array of JSON objects", async () => {
    const input = `[
        {
            "name": "John"
        },
        {
            "name": "Jane"
        }
    ]`;
    const expectedOutput = '[{"name":"John"},{"name":"Jane"}]';

    await expectOutputForInput(minify_json, input, expectedOutput);
});

Deno.test("minify_json should handle JSON with special characters", async () => {
    const input = `{
        "text": "Hello, world! \\n New line."
    }`;
    const expectedOutput = '{"text":"Hello, world! \\n New line."}';

    await expectOutputForInput(minify_json, input, expectedOutput);
});

Deno.test("minify_json should handle JSON with different data types", async () => {
    const input = `{
        "string": "text",
        "number": 123,
        "boolean": true,
        "null": null
    }`;
    const expectedOutput = '{"string":"text","number":123,"boolean":true,"null":null}';

    await expectOutputForInput(minify_json, input, expectedOutput);
});