import { describe, expect, it, vi } from "vitest";
import {
  listPersonalAccessTokens,
  createPersonalAccessToken,
  revokePersonalAccessToken,
} from "./api";
import type { PersonalAccessToken } from "./types";
import { request } from "@/lib/http/client";

vi.mock("@/lib/http/client", () => ({
  request: vi.fn(),
}));

describe("tokens/api", () => {
  it("listPersonalAccessTokens calls GET", async () => {
    vi.mocked(request).mockResolvedValue([]);

    const res = await listPersonalAccessTokens();

    expect(request).toHaveBeenCalledWith("/api/v1/personal-access-tokens");
    expect(res).toEqual([]);
  });

  it("createPersonalAccessToken calls POST with payload", async () => {
    vi.mocked(request).mockResolvedValue({
      message: "Created",
      plain_text_token: "1|secret",
      data: {} as unknown as PersonalAccessToken,
    });

    const input = {
      name: "Token 1",
      abilities: ["account:read" as const],
      expires_at: "2026-12-31",
    };

    const res = await createPersonalAccessToken(input);

    expect(request).toHaveBeenCalledWith("/api/v1/personal-access-tokens", {
      method: "POST",
      body: JSON.stringify(input),
    });
    expect(res.plain_text_token).toBe("1|secret");
  });

  it("revokePersonalAccessToken calls DELETE with encoded ID", async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await revokePersonalAccessToken("token/1");

    expect(request).toHaveBeenCalledWith("/api/v1/personal-access-tokens/token%2F1", {
      method: "DELETE",
      body: "{}",
    });
  });
});
