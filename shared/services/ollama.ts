/**
 * The local model behind the report summaries: one JSON chat call to Ollama, plus the checks
 * every answer must pass before it is shown (shared by aiSummary.ts and aiTravelSummary.ts).
 */

export type OllamaConfig = {
  /** Base URL of the Ollama API; the browser uses the same-origin `/proxy/ollama`. */
  baseUrl: string;
  model: string;
  timeoutMs?: number;
};

const numberPattern = /\d+(?:[.,]\d+)?/g;

/** Every number the model writes must appear in its input, so it can't invent figures. */
export function numbersAreGrounded(text: string, input: string) {
  const known = new Set(input.match(numberPattern)?.map((n) => n.replace(',', '.')));
  return (text.match(numberPattern) ?? []).every((n) => known.has(n.replace(',', '.')));
}

/**
 * Insurance talk belongs to the computed sentences. A word is only allowed when the input
 * itself uses it (for example the risk "No home insurance yet"), in any form: "covered" in the
 * input allows "covers".
 */
const insuranceWords =
  /\b(insurance|insured|cover(?:s|ed|age)?|polic(?:y|ies)|perus|laaja(?:plus)?|claims?|compensat\w*)\b/gi;

const stem = (word: string) =>
  word
    .toLowerCase()
    .replace(/^cover\w*/, 'cover')
    .replace(/^polic\w*/, 'policy')
    .replace(/^claims?$/, 'claim')
    .replace(/^compensat\w*/, 'compensate');

export function mentionsInsurance(text: string, input: string) {
  const allowed = new Set(input.match(insuranceWords)?.map(stem));
  return (text.match(insuranceWords) ?? []).some((word) => !allowed.has(stem(word)));
}

export const sentenceCount = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean).length;

/** Small stable hash for cache keys. */
export function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export type ChatRequest = {
  system: string;
  user: string;
  /** JSON schema Ollama constrains the answer to. */
  schema: object;
  temperature: number;
  maxTokens: number;
};

/** One non-streaming chat call; returns the parsed JSON answer. Throws on any failure. */
export async function chatJson(
  config: OllamaConfig,
  request: ChatRequest,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      format: request.schema,
      keep_alive: '15m',
      options: { temperature: request.temperature, num_predict: request.maxTokens },
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: request.user },
      ],
    }),
    signal,
  });
  if (!response.ok) throw new Error(`Ollama answered ${response.status}`);
  const data = (await response.json()) as { message?: { content?: string } };
  return JSON.parse(data.message?.content ?? 'null') as unknown;
}

/** The caller's signal plus a timeout. */
export function abortAfter(ms: number, signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
