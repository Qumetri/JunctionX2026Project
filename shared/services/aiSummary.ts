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
import {
  abortAfter,
  chatJson,
  hash,
  mentionsInsurance,
  numbersAreGrounded,
  sentenceCount,
  type OllamaConfig,
} from './ollama';

export type { OllamaConfig };

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

function valid(value: unknown, input: string): value is { overview: string } {
  if (typeof value !== 'object' || value === null) return false;
  const { overview } = value as Record<string, unknown>;
  if (typeof overview !== 'string') return false;
  const text = overview.trim();
  if (text.length < 40 || text.length > 420 || sentenceCount(text) > 3) return false;
  return numbersAreGrounded(text, input) && !mentionsInsurance(text, input);
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

  const abort = abortAfter(config.timeoutMs ?? 60_000, signal);

  const ask = async (temperature: number) => {
    const parsed = await chatJson(
      config,
      { system, user: context, schema, temperature, maxTokens: 160 },
      abort,
    );
    return valid(parsed, context) ? parsed.overview.trim() : undefined;
  };

  try {
    // Small models fail the checks now and then; one retry with a little more variety helps.
    const overview = (await ask(0.2)) ?? (await ask(0.5));
    if (!overview) return { ...fallback, reason: 'rejected' };
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
    return { ...fallback, reason: 'unavailable' };
  }
}
