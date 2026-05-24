export type OpenAIHealthResult = {
  configured: boolean;
  ok: boolean;
  model: string;
  status?: number;
  responseId?: string;
  outputText?: string;
  message: string;
};

type FetchLike = typeof fetch;

export const DEFAULT_OPENAI_HEALTH_MODEL = "gpt-4.1-mini";

export async function checkOpenAIHealth(fetchImpl: FetchLike = fetch): Promise<OpenAIHealthResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_HEALTH_MODEL || DEFAULT_OPENAI_HEALTH_MODEL;

  if (!apiKey) {
    return {
      configured: false,
      ok: false,
      model,
      message: "OPENAI_API_KEY is not configured."
    };
  }

  try {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: "Reply with exactly: ok",
        max_output_tokens: 16,
        store: false
      })
    });

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok) {
      const error = payload?.error as { message?: string } | undefined;
      return {
        configured: true,
        ok: false,
        model,
        status: response.status,
        message: error?.message || `OpenAI request failed with HTTP ${response.status}.`
      };
    }

    return {
      configured: true,
      ok: true,
      model,
      status: response.status,
      responseId: typeof payload?.id === "string" ? payload.id : undefined,
      outputText: typeof payload?.output_text === "string" ? payload.output_text : undefined,
      message: "OpenAI API key is configured and reachable."
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      model,
      message: error instanceof Error ? error.message : "OpenAI health check failed."
    };
  }
}
