import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import md5_hash from "../commands/md5_hash";

Deno.test("md5_hash should generate an MD5 hash and append it to the input", async () => {
    const input = "Hello, world!";
    const expectedOutput = `Hello, world!\nMD5 Hash: 6cd3556deb0da54bca060b4c39479839`;

    await expectOutputForInput(md5_hash, input, expectedOutput);
});

Deno.test("md5_hash should handle empty input", async () => {
    const input = "";
    const expectedOutput = `\nMD5 Hash: d41d8cd98f00b204e9800998ecf8427e`;

    await expectOutputForInput(md5_hash, input, expectedOutput);
});