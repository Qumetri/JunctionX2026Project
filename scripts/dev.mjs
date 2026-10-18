/**
 * `npm run dev`: starts Vite at once and, beside it, gets the local AI ready if it can. Ollama is
 * optional: when it isn't installed or fails, the app still runs and shows template summaries.
 *
 * - Ollama already running (app or service): used as it is.
 * - Installed but not running: `ollama serve` is started and stopped again with Vite.
 * - Model missing: pulled through the Ollama API, then loaded so the first summary is quick.
 *
 * OLLAMA=off npm run dev   skips all of it (same as `npm run dev:web`).
 * The model is VITE_OLLAMA_MODEL from the environment or a .env file, as in src/api/report.ts.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const api = 'http://127.0.0.1:11434'; // the /proxy/ollama target in vite.config.ts
const env = { ...loadEnv('development', process.cwd(), 'VITE_'), ...process.env };
const model = env.VITE_OLLAMA_MODEL ?? 'qwen2.5:3b';
const log = (message) => console.log(`\x1b[35m[ollama]\x1b[0m ${message}`);

const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const vite = spawn(process.execPath, [viteBin, ...process.argv.slice(2)], { stdio: 'inherit' });

/** `ollama serve` when this script started it, so it stops with Vite. */
let server;

const stop = () => server?.kill();
vite.on('exit', (code) => {
  stop();
  process.exit(code ?? 0);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => vite.kill(signal));

async function reachable() {
  try {
    return (await fetch(`${api}/api/version`, { signal: AbortSignal.timeout(1500) })).ok;
  } catch {
    return false;
  }
}

async function startServer() {
  server = spawn('ollama', ['serve'], { stdio: 'ignore' });
  const failed = new Promise((resolve) => server.on('error', () => resolve(false)));
  const ready = (async () => {
    for (let i = 0; i < 40; i++) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (await reachable()) return true;
    }
    return false;
  })();
  return Promise.race([failed, ready]);
}

async function hasModel() {
  const response = await fetch(`${api}/api/tags`);
  const { models = [] } = await response.json();
  return models.some((entry) => entry.name === model || entry.name === `${model}:latest`);
}

async function prepare() {
  if (!(await reachable())) {
    log('starting ollama serve…');
    if (!(await startServer())) {
      server = undefined;
      log('Ollama is not installed or did not start; summaries use the template.');
      log('Install it from https://ollama.com to get AI summaries.');
      return;
    }
  }

  if (!(await hasModel())) {
    log(`pulling ${model}, about 2 GB the first time…`);
    const response = await fetch(`${api}/api/pull`, {
      method: 'POST',
      body: JSON.stringify({ model, stream: false }),
    });
    if (!response.ok) throw new Error(`pull answered ${response.status}`);
  }

  // An empty prompt only loads the model, so the first summary doesn't wait for it.
  await fetch(`${api}/api/generate`, {
    method: 'POST',
    body: JSON.stringify({ model, prompt: '', keep_alive: '30m' }),
  });
  log(`${model} is ready${server ? ' (stops with the dev server)' : ''}.`);
}

if (/^(0|off|false|no)$/i.test(env.OLLAMA ?? '')) {
  log('skipped (OLLAMA=off); summaries use the template.');
} else {
  prepare().catch((error) => log(`not ready (${error.message}); summaries use the template.`));
}
