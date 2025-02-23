import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import json_to_csv from "../commands/json_to_csv";

Deno.test("json_to_csv should convert valid JSON to CSV", async () => {
    const input = `[
  {
    "name": "John",
    "age": 30,
    "city": "New York"
  },
  {
    "name": "Jane",
    "age": 25,
    "city": "Los Angeles"
  }
]`;
    const expectedOutput = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    await expectOutputForInput(json_to_csv, input, expectedOutput);
});

Deno.test("json_to_csv should have error on invalid JSON", async () => {
    const input = `[
  {
    "name": "John",
    "age": 30,
    "city": "New York"
  },
  {
    "name": "Jane",
    "age": 25,
    "city": "Los Angeles"
  `;

    await expectInputGivesError(json_to_csv, input, "Error: Invalid JSON");
});

Deno.test("json_to_csv should handle empty JSON array", async () => {
    const input = `[]`;
    const expectedOutput = ``;

    await expectOutputForInput(json_to_csv, input, expectedOutput);
});