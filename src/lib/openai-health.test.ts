import { afterEach, describe, expect, it, vi } from "vitest";
import { checkOpenAIHealth, DEFAULT_OPENAI_HEALTH_MODEL } from "@/lib/openai-health";

const originalKey = process.env.OPENAI_API_KEY;
const originalModel = process.env.OPENAI_HEALTH_MODEL;

afterEach(() => {
  process.env.OPENAI_API_KEY = originalKey;
  process.env.OPENAI_HEALTH_MODEL = originalModel;
  vi.restoreAllMocks();
});

describe("checkOpenAIHealth", () => {
  it("reports unconfigured when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_HEALTH_MODEL;

    const result = await checkOpenAIHealth();

    expect(result.configured).toBe(false);
    expect(result.ok).toBe(false);
    expect(result.model).toBe(DEFAULT_OPENAI_HEALTH_MODEL);
  });

  it("calls the Responses API with a minimal request", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_HEALTH_MODEL = "test-model";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "resp_test", output_text: "ok" }), { status: 200 })
    ) as unknown as typeof fetch;

    const result = await checkOpenAIHealth(fetchMock);

    expect(result.ok).toBe(true);
    expect(result.configured).toBe(true);
    expect(result.model).toBe("test-model");
    expect(result.responseId).toBe("resp_test");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" })
      })
    );
  });

  it("returns OpenAI error messages without throwing", async () => {
    process.env.OPENAI_API_KEY = "bad-key";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: "Invalid API key" } }), { status: 401 })
    ) as unknown as typeof fetch;

    const result = await checkOpenAIHealth(fetchMock);

    expect(result.ok).toBe(false);
    expect(result.configured).toBe(true);
    expect(result.status).toBe(401);
    expect(result.message).toBe("Invalid API key");
  });
});
