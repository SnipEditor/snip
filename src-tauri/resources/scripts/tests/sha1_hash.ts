import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import sha1_hash from "../commands/sha1_hash";

Deno.test("sha1_hash should generate a SHA-1 hash and append it to the input", async () => {
    const input = "Hello, world!";
    const expectedOutput = `Hello, world!\nSHA-1 Hash: 943a702d06f34599aee1f8da8ef9f7296031d699`;

    await expectOutputForInput(sha1_hash, input, expectedOutput);
});

Deno.test("sha1_hash should handle empty input", async () => {
    const input = "";
    const expectedOutput = `\nSHA-1 Hash: da39a3ee5e6b4b0d3255bfef95601890afd80709`;

    await expectOutputForInput(sha1_hash, input, expectedOutput);
});