/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Ollama API base for the report summary. Default `/proxy/ollama` (Vite dev proxy). */
  readonly VITE_OLLAMA_URL?: string;
  /** Local model for the report summary. Default `qwen2.5:3b`. */
  readonly VITE_OLLAMA_MODEL?: string;
}
