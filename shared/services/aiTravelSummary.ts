/**
 * Travel summary and tips from a local model through Ollama, in two calls. The model rewrites
 * the two biggest risks in plain words and turns the expert tips into tips for this trip. Each
 * part is checked on its own; a part that fails keeps its template version, and the score and
 * cover sentences are always computed.
 */
import { days, type CacheStore } from '../cache/store';
import {
  templateTravelSummary,
  travelScoreSentence,
  type TravelSummary,
  type TravelSummaryInput,
} from '../engine/travelSummary';
import {
  abortAfter,
  chatJson,
  hash,
  mentionsInsurance,
  numbersAreGrounded,
  sentenceCount,
  type OllamaConfig,
} from './ollama';

const overviewSchema = {
  type: 'object',
  properties: { overview: { type: 'string' } },
  required: ['overview'],
};

const tipsSchema = {
  type: 'object',
  properties: { tips: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 } },
  required: ['tips'],
};

// Two prompts, two calls: a small model shown the tips puts their advice in the overview too.
const overviewSystem = `You explain the biggest risks of a trip abroad to the traveller.
You get JSON with the trip and its biggest risks, most important first.
Write 2 or 3 short sentences in plain, friendly English, speaking to the reader as "you". Explain the first two risks: what can happen and why it matters on this trip, using only each risk's "why" text and evidence.
Only describe the risks. Do not give advice or tell the reader what to do: no "make sure", "check", "book", "keep" or "pack". Do not mention insurance, cover or the score. Do not start by repeating the destination or dates. No markdown, no greetings.`;

const tipsSystem = `You help someone prepare for a trip abroad.
You get JSON with the trip, its biggest risks (most important first) and tips written by travel experts.
Return 3 to 5 practical tips on how to prepare for this trip. Base every tip on the expert tips: you may merge, shorten or reorder them and mention the destination or season, but do not add rules, requirements, prices or numbers that are not in the JSON. Each tip is one or two short sentences.
Do not say what insurance pays for. No markdown, no numbering, no greetings.`;

const words = (text: string) => text.toLowerCase().match(/[a-z0-9']+/g) ?? [];

/** Every run of four words in a row in `text`. */
function runsOf(text: string) {
  const w = words(text);
  return w.slice(0, -3).map((_, i) => w.slice(i, i + 4).join(' '));
}

/** True when `text` repeats four words in a row from one of `sources` (and not from `own`). */
function copiesFrom(text: string, sources: string[], own = '') {
  const allowed = new Set(runsOf(own));
  const runs = new Set(sources.flatMap(runsOf).filter((run) => !allowed.has(run)));
  return runsOf(text).some((run) => runs.has(run));
}

const maxSentences = 3;

/** "You're heading to Bangkok for the holidays." repeats the score sentence before it. */
const tripIntro = /^you(?:'re| are) (?:heading|going|travelling|traveling|planning|off)\b/i;

/** Small models often open with the trip and write one sentence too many; keep the risks. */
function firstSentences(text: string) {
  const sentences = text.trim().split(/(?<=[.!?])\s+/);
  if (sentences.length > 1 && tripIntro.test(sentences[0])) sentences.shift();
  return sentences.slice(0, maxSentences).join(' ');
}

/**
 * The overview describes risks; advice copied from the tips belongs in the tips section. "EHIC
 * doesn't cover you" is about the health card, not insurance, so that "cover" is allowed.
 */
function validOverview(text: string, risks: string, tips: string[]) {
  if (text.length < 40 || text.length > 420 || sentenceCount(text) > maxSentences) return false;
  const insuranceText = text.replace(/\bEHIC\b[^.!?]*?\bcover(?:s|ed)?\b/gi, 'EHIC');
  return (
    numbersAreGrounded(text, risks) &&
    !mentionsInsurance(insuranceText, risks) &&
    !copiesFrom(text, tips, risks)
  );
}

/** Drops bullets or numbering the model adds despite the prompt. */
const cleanTip = (tip: string) => tip.trim().replace(/^(?:[-•*]|\d+[.)])\s*/, '');

function validTips(value: unknown, input: string): value is string[] {
  if (!Array.isArray(value) || value.length < 3 || value.length > 5) return false;
  return value.every((tip) => {
    if (typeof tip !== 'string') return false;
    const text = cleanTip(tip);
    if (text.length < 20 || text.length > 240 || sentenceCount(text) > 2) return false;
    return numbersAreGrounded(text, input) && !mentionsInsurance(text, input);
  });
}

/** Small models sometimes say the same thing twice; each tip must be its own. */
const repeats = (tips: string[]) =>
  tips.some((tip, i) =>
    copiesFrom(
      tip,
      tips.filter((_, j) => j !== i),
    ),
  );

export async function aiTravelSummary(
  input: TravelSummaryInput,
  config: OllamaConfig,
  cache: CacheStore,
  signal?: AbortSignal,
): Promise<TravelSummary> {
  const fallback = templateTravelSummary(input);
  if (input.risks.length === 0) return fallback;
  // The model sees the trip and the three biggest risks (plus the expert tips for the tips call):
  // no score, no cover.
  const trip = {
    destination: input.destination,
    dates: input.dates,
    days: input.days,
    daysUntilDeparture: input.daysUntil,
    season: input.season ?? null,
    risks: input.risks.slice(0, 3).map(({ title, why, evidence }) => ({ title, why, evidence })),
  };
  const context = JSON.stringify({ ...trip, expertTips: input.tips });
  // The overview is checked against the risks alone, so wording from the tips can't slip in.
  const risksOnly = JSON.stringify(trip);
  const key = `travelsummary:${config.model}:${hash(overviewSystem + tipsSystem + context)}`;
  const hit = cache.get<TravelSummary>(key);
  if (hit) return hit;

  const abort = abortAfter(config.timeoutMs ?? 90_000, signal);
  const ask = (system: string, user: string, schema: object, temperature: number) =>
    chatJson(config, { system, user, schema, temperature, maxTokens: 400 }, abort).then(
      (parsed) => (parsed ?? {}) as Record<string, unknown>,
    );
  // Small models fail the checks now and then; one retry with a little more variety helps.
  const askOverview = async () => {
    for (const temperature of [0.2, 0.5]) {
      const { overview } = await ask(overviewSystem, risksOnly, overviewSchema, temperature);
      if (typeof overview !== 'string') continue;
      const text = firstSentences(overview);
      if (validOverview(text, risksOnly, input.tips)) return text;
    }
    return undefined;
  };
  const askTips = async () => {
    for (const temperature of [0.2, 0.5]) {
      const { tips } = await ask(tipsSystem, context, tipsSchema, temperature);
      if (validTips(tips, context) && !repeats(tips)) return tips.map(cleanTip);
    }
    return undefined;
  };

  try {
    const [overview, tips] = await Promise.all([askOverview(), askTips()]);
    if (!overview && !tips) return { ...fallback, reason: 'rejected' };
    const summary: TravelSummary = {
      overview: overview ? `${travelScoreSentence(input)} ${overview}` : fallback.overview,
      cover: fallback.cover,
      tips: tips ?? fallback.tips,
      source: overview ? 'ai' : 'template',
      tipsSource: tips ? 'ai' : 'template',
      model: config.model,
      ...(overview ? {} : { reason: 'rejected' as const }),
    };
    cache.set(key, summary, days(1));
    return summary;
  } catch {
    // Ollama not running, model not pulled, timeout or bad JSON.
    return { ...fallback, reason: 'unavailable' };
  }
}
