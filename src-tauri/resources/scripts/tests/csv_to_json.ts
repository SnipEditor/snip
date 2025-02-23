import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import csv_to_json from "../commands/csv_to_json";

Deno.test("csv_to_json should convert valid CSV to JSON", async () => {
    const input = `name,age,city
John,30,New York
Jane,25,Los Angeles`;
    const expectedOutput = `[
  {
    "name": "John",
    "age": "30",
    "city": "New York"
  },
  {
    "name": "Jane",
    "age": "25",
    "city": "Los Angeles"
  }
]`;

    await expectOutputForInput(csv_to_json, input, expectedOutput);
});

Deno.test("csv_to_json should handle empty CSV", async () => {
    const input = ``;
    const expectedOutput = `[]`;

    await expectOutputForInput(csv_to_json, input, expectedOutput);
});