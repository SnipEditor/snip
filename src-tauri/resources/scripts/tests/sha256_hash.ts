import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import sha256_hash from "../commands/sha256_hash";

Deno.test("sha256_hash should generate a SHA-256 hash and append it to the input", async () => {
    const input = "Hello, world!";
    const expectedOutput = `Hello, world!\nSHA-256 Hash: 315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3`;

    await expectOutputForInput(sha256_hash, input, expectedOutput);
});

Deno.test("sha256_hash should handle empty input", async () => {
    const input = "";
    const expectedOutput = `\nSHA-256 Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;

    await expectOutputForInput(sha256_hash, input, expectedOutput);
});