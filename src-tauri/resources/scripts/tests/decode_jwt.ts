import { expectOutputForInput, expectInputGivesError } from "./helpers/test_methods.ts";
import decode_jwt from "../commands/decode_jwt";

Deno.test("decode_jwt should decode a valid JWT token", async () => {
    const input = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const expectedOutput = `{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
  }
}`;

    await expectOutputForInput(decode_jwt, input, expectedOutput);
});

Deno.test("decode_jwt should handle invalid JWT token", async () => {
    const input = "invalid.jwt.token";

    await expectInputGivesError(decode_jwt, input, "Error: Invalid JWT token");
});

Deno.test("decode_jwt should error on empty input", async () => {
    const input = "";

    await expectInputGivesError(decode_jwt, input, "Error: Invalid JWT token");
});