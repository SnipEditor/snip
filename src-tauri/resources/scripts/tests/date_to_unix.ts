import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import date_to_unix from "../commands/date_to_unix";

Deno.test("date_to_unix should convert a date string to a Unix timestamp", async () => {
    const input = "October 1, 2021 00:00:00 GMT";
    const expectedOutput = "1633046400";

    await expectOutputForInput(date_to_unix, input, expectedOutput);
});

Deno.test("date_to_unix should handle invalid date string", async () => {
    const input = "invalid_date";

    await expectInputGivesError(date_to_unix, input, "Error: Invalid date string");
});

Deno.test("date_to_unix should error on empty input", async () => {
    const input = "";

    await expectInputGivesError(date_to_unix, input, "Error: Invalid date string");
});