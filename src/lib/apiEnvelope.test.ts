import { describe, expect, it } from "vitest";
import { errorEnvelope, successEnvelope } from "./apiEnvelope";

describe("successEnvelope", () => {
  it("marks payload as ok and preserves data", () => {
    const body = successEnvelope({ id: "u1", name: "Ada" });
    expect(body).toEqual({
      ok: true,
      data: { id: "u1", name: "Ada" },
    });
  });
});

describe("errorEnvelope", () => {
  it("returns a stable error shape with code and message", () => {
    const body = errorEnvelope("NOT_FOUND", "User not found");
    expect(body).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "User not found" },
    });
  });
});
