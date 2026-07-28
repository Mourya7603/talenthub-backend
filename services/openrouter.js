const fetch = require("node-fetch");
const ApiError = require("../utils/ApiError");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Calls the OpenRouter chat completions endpoint.
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} options
 * @returns {Promise<string>} assistant text content
 */
const callOpenRouter = async (messages, options = {}) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new ApiError(503, "AI service is not configured. Missing OPENROUTER_API_KEY.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 25000);

  let response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
        "X-Title": process.env.OPENROUTER_APP_NAME || "TalentHub",
      },
      body: JSON.stringify({
        model: options.model || process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens || 700,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new ApiError(504, "AI service timed out. Please try again.");
    }
    throw new ApiError(503, "Could not reach the AI service. Please try again later.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message || "";
    } catch (_) {
      /* ignore parse errors */
    }
    throw new ApiError(
      response.status === 429 ? 429 : 502,
      response.status === 429
        ? "AI service rate limit reached. Please try again in a moment."
        : `AI service error${detail ? ": " + detail : ""}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new ApiError(502, "AI service returned an empty response.");
  }

  return content.trim();
};

module.exports = { callOpenRouter };
