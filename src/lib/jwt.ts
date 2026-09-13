export function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  const json = Buffer.from(payload, "base64url").toString("utf-8");
  return JSON.parse(json);
}
