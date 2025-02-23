import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import sha512_hash from "../commands/sha512_hash";

Deno.test("sha512_hash should generate a SHA-512 hash and append it to the input", async () => {
    const input = "Hello, world!";
    const expectedOutput = `Hello, world!\nSHA-512 Hash: c1527cd893c124773d811911970c8fe6e857d6df5dc9226bd8a160614c0cd963a4ddea2b94bb7d36021ef9d865d5cea294a82dd49a0bb269f51f6e7a57f79421`;

    await expectOutputForInput(sha512_hash, input, expectedOutput);
});

Deno.test("sha512_hash should handle empty input", async () => {
    const input = "";
    const expectedOutput = `\nSHA-512 Hash: cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e`;

    await expectOutputForInput(sha512_hash, input, expectedOutput);
});