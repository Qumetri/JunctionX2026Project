/**
 * Short report summary from a local model through Ollama (no key, nothing leaves the machine).
 * The model only rewrites the risk overview in plain words; it never sees or describes
 * insurance, so the plan sentence stays computed. Any failure, slow answer or answer that fails
 * the checks returns the template summary instead.
 */
import { days, type CacheStore } from '../cache/store';
import {
  scoreSentence,
  templatePlan,
  templateSummary,
  type Summary,
  type SummaryInput,
} from '../engine/summary';

export type OllamaConfig = {
  /** Base URL of the Ollama API; the browser uses the same-origin `/proxy/ollama`. */
  baseUrl: string;
  model: string;
  timeoutMs?: number;
};

const schema = {
  type: 'object',
  properties: { overview: { type: 'string' } },
  required: ['overview'],
};

const system = `You help someone who is moving home understand their two biggest risks.
You get a JSON list of risks, most important first. Each has a title, a "why" text and evidence.
Write 2 or 3 short sentences in plain, friendly English, speaking to the reader as "you".
Cover the first two risks: say what each one is and why it matters, using only its "why" text and evidence.
Do not add consequences, advice, numbers or facts that are not in the JSON. Do not mention the overall score, insurance, cover or plans.
No lists, no markdown, no greetings. Return JSON: {"overview": "<your sentences>"}`;

const numberPattern = /\d+(?:[.,]\d+)?/g;

/** Every number the model writes must appear in its input, so it can't invent figures. */
function numbersAreGrounded(text: string, input: string) {
  const known = new Set(input.match(numberPattern)?.map((n) => n.replace(',', '.')));
  return (text.match(numberPattern) ?? []).every((n) => known.has(n.replace(',', '.')));
}

/**
 * Insurance talk belongs to the computed plan sentence. A word is only allowed when the input
 * itself uses it (for example the risk "No home insurance yet").
 */
const insuranceWords =
  /\b(insurance|insured|cover(?:s|ed|age)?|polic(?:y|ies)|perus|laaja(?:plus)?|claims?|compensat\w*)\b/gi;

function mentionsInsurance(text: string, input: string) {
  const allowed = new Set(input.match(insuranceWords)?.map((word) => word.toLowerCase()));
  return (text.match(insuranceWords) ?? []).some((word) => !allowed.has(word.toLowerCase()));
}

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean).length;

function valid(value: unknown, input: string): value is { overview: string } {
  if (typeof value !== 'object' || value === null) return false;
  const { overview } = value as Record<string, unknown>;
  if (typeof overview !== 'string') return false;
  const text = overview.trim();
  if (text.length < 40 || text.length > 420 || sentences(text) > 3) return false;
  return numbersAreGrounded(text, input) && !mentionsInsurance(text, input);
}

/** Small stable hash for the cache key. */
function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export async function aiSummary(
  input: SummaryInput,
  config: OllamaConfig,
  cache: CacheStore,
  signal?: AbortSignal,
): Promise<Summary> {
  const fallback = templateSummary(input);
  // The model sees the two biggest risks only: no score, no plan.
  const context = JSON.stringify(
    input.risks.slice(0, 2).map(({ title, why, evidence }) => ({ title, why, evidence })),
  );
  if (input.risks.length === 0) return fallback;
  const key = `summary:${config.model}:${hash(system + context)}`;
  const hit = cache.get<Summary>(key);
  if (hit) return hit;

  const timeout = AbortSignal.timeout(config.timeoutMs ?? 60_000);
  const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;

  const ask = async (temperature: number) => {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        format: schema,
        keep_alive: '15m',
        options: { temperature, num_predict: 160 },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: context },
        ],
      }),
      signal: abort,
    });
    if (!response.ok) throw new Error(`Ollama answered ${response.status}`);
    const data = (await response.json()) as { message?: { content?: string } };
    const parsed: unknown = JSON.parse(data.message?.content ?? 'null');
    return valid(parsed, context) ? parsed.overview.trim() : undefined;
  };

  try {
    // Small models fail the checks now and then; one retry with a little more variety helps.
    const overview = (await ask(0.2)) ?? (await ask(0.5));
    if (!overview) return fallback;
    const summary: Summary = {
      overview: `${scoreSentence(input)} ${overview}`,
      plan: templatePlan(input),
      source: 'ai',
      model: config.model,
    };
    cache.set(key, summary, days(1));
    return summary;
  } catch {
    // Ollama not running, model not pulled, timeout or bad JSON.
    return fallback;
  }
}
