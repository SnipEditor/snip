import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import json_to_yaml from "../commands/json_to_yaml";

Deno.test("convert_json_to_yaml should convert valid JSON to YAML", async () => {
    const input = '{"name":"John","age":30,"city":"New York"}';
    const expectedOutput = `name: John
age: 30
city: New York
`;

    await expectOutputForInput(json_to_yaml, input, expectedOutput);
});

Deno.test("convert_json_to_yaml should have error on invalid JSON", async () => {
    const input = '{"name":"John","age":30,"city":"New York"';

    await expectInputGivesError(json_to_yaml, input, "Error: Invalid JSON");
});

Deno.test("convert_json_to_yaml should handle empty JSON object", async () => {
    const input = '{}';
    const expectedOutput = '{}\n';

    await expectOutputForInput(json_to_yaml, input, expectedOutput);
});

Deno.test("convert_json_to_yaml should handle nested JSON objects", async () => {
    const input = '{"person":{"name":"John","address":{"city":"New York"}}}';
    const expectedOutput = `person:
  name: John
  address:
    city: New York
`;

    await expectOutputForInput(json_to_yaml, input, expectedOutput);
});

Deno.test("convert_json_to_yaml should handle array of JSON objects", async () => {
    const input = '[{"name":"John"},{"name":"Jane"}]';
    const expectedOutput = `- name: John
- name: Jane
`;

    await expectOutputForInput(json_to_yaml, input, expectedOutput);
});

Deno.test("convert_json_to_yaml should handle JSON with special characters", async () => {
    const input = '{"text":"Hello, world! \\" New line."}';
    const expectedOutput = `text: Hello, world! \" New line.\n`;

    await expectOutputForInput(json_to_yaml, input, expectedOutput);
});

Deno.test("convert_json_to_yaml should handle JSON with different data types", async () => {
    const input = '{"string":"text","number":123,"boolean":true,"null":null}';
    const expectedOutput = `string: text
number: 123
boolean: true
'null': null
`;

    await expectOutputForInput(json_to_yaml, input, expectedOutput);
});