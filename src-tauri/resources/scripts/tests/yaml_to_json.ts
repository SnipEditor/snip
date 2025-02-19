import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import yaml_to_json from "../commands/yaml_to_json";

Deno.test("convert_yaml_to_json should convert valid YAML to JSON", async () => {
    const input = `name: John
age: 30
city: New York`;
    const expectedOutput = `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`;

    await expectOutputForInput(yaml_to_json, input, expectedOutput);
});

Deno.test("convert_yaml_to_json should have error on invalid YAML", async () => {
    const input = `name: John
age: 30
city New York`;

    await expectInputGivesError(yaml_to_json, input, "Error: Invalid YAML");
});

Deno.test("convert_yaml_to_json should handle empty YAML object", async () => {
    const input = ``;
    const expectedOutput = `{}`;

    await expectOutputForInput(yaml_to_json, input, expectedOutput);
});

Deno.test("convert_yaml_to_json should handle nested YAML objects", async () => {
    const input = `person:
  name: John
  address:
    city: New York`;
    const expectedOutput = `{
  "person": {
    "name": "John",
    "address": {
      "city": "New York"
    }
  }
}`;

    await expectOutputForInput(yaml_to_json, input, expectedOutput);
});

Deno.test("convert_yaml_to_json should handle array of YAML objects", async () => {
    const input = `- name: John
- name: Jane`;
    const expectedOutput = `[
  {
    "name": "John"
  },
  {
    "name": "Jane"
  }
]`;

    await expectOutputForInput(yaml_to_json, input, expectedOutput);
});

Deno.test("convert_yaml_to_json should handle YAML with special characters", async () => {
    const input = `text: "Hello, world! \\n New line."`;
    const expectedOutput = `{
  "text": "Hello, world! \\n New line."
}`;

    await expectOutputForInput(yaml_to_json, input, expectedOutput);
});

Deno.test("convert_yaml_to_json should handle YAML with different data types", async () => {
    const input = `string: text
number: 123
boolean: true
null: null`;
    const expectedOutput = `{
  "string": "text",
  "number": 123,
  "boolean": true,
  "null": null
}`;

    await expectOutputForInput(yaml_to_json, input, expectedOutput);
});