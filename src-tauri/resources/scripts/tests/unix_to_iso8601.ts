import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import unix_to_iso8601 from "../commands/unix_to_iso8601";

Deno.test("unix_to_iso8601 should convert a Unix timestamp to an ISO 8601 date", async () => {
    const input = "1633046400";
    const expectedOutput = "2021-10-01T00:00:00.000Z";

    await expectOutputForInput(unix_to_iso8601, input, expectedOutput);
});

Deno.test("unix_to_iso8601 should handle invalid Unix timestamp", async () => {
    const input = "invalid_timestamp";

    await expectInputGivesError(unix_to_iso8601, input, "Error: Invalid Unix timestamp");
});

Deno.test("unix_to_iso8601 should error on empty input", async () => {
    const input = "";

    await expectInputGivesError(unix_to_iso8601, input, "Error: Invalid Unix timestamp");
});