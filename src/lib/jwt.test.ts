import { describe, it, expect } from "vitest";
import { decodeJwtPayload } from "./jwt";

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature-no-verificada-en-este-test`;
}

describe("decodeJwtPayload", () => {
  it("decodifica el claim user_role de un JWT", () => {
    const token = fakeJwt({ sub: "user-123", user_role: "admin" });
    expect(decodeJwtPayload(token)).toMatchObject({ sub: "user-123", user_role: "admin" });
  });

  it("decodifica un payload sin el claim personalizado", () => {
    const token = fakeJwt({ sub: "user-456" });
    const payload = decodeJwtPayload(token);
    expect(payload.user_role).toBeUndefined();
  });
});
