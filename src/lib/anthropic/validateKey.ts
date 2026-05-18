type ValidateResult =
  | { valid: true }
  | { valid: false; reason: "invalid_key" | "rate_limited" | "network_error" };

/**
 * Validates an Anthropic API key by making a minimal /v1/messages request.
 * The request sends 1 token — cheapest possible valid call.
 * Returns { valid: true } on 200 or { valid: false, reason } otherwise.
 */
export async function validateAnthropicKey(apiKey: string): Promise<ValidateResult> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, reason: "invalid_key" };
    if (res.status === 429) return { valid: false, reason: "rate_limited" };
    // 400 means key is valid but payload malformed — treat as valid
    if (res.status === 400) return { valid: true };
    return { valid: false, reason: "invalid_key" };
  } catch {
    return { valid: false, reason: "network_error" };
  }
}
