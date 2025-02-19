import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import sort_json from "../commands/sort_json";

Deno.test("sort_json should sort keys of a JSON object alphabetically", async () => {
    const input = `{
        "name": "John",
        "age": 30,
        "city": "New York"
    }`;
    const expectedOutput = `{
  "age": 30,
  "city": "New York",
  "name": "John"
}`;

    await expectOutputForInput(sort_json, input, expectedOutput);
});

Deno.test("sort_json should sort keys of nested JSON objects alphabetically", async () => {
    const input = `{
        "person": {
            "name": "John",
            "address": {
                "city": "New York",
                "zipcode": "10001"
            },
            "age": 30
        }
    }`;
    const expectedOutput = `{
  "person": {
    "address": {
      "city": "New York",
      "zipcode": "10001"
    },
    "age": 30,
    "name": "John"
  }
}`;

    await expectOutputForInput(sort_json, input, expectedOutput);
});

Deno.test("sort_json should handle arrays within JSON objects", async () => {
    const input = `{
        "name": "John",
        "hobbies": ["reading", "swimming"],
        "age": 30
    }`;
    const expectedOutput = `{
  "age": 30,
  "hobbies": [
    "reading",
    "swimming"
  ],
  "name": "John"
}`;

    await expectOutputForInput(sort_json, input, expectedOutput);
});

Deno.test("sort_json should handle invalid JSON", async () => {
    const input = `{
        "name": "John",
        "age": 30,
        "city": "New York"
    `;

    await expectInputGivesError(sort_json, input, "Error: Invalid JSON");
});

Deno.test("sort_json should handle empty JSON object", async () => {
    const input = `{}`;
    const expectedOutput = `{}`;

    await expectOutputForInput(sort_json, input, expectedOutput);
});