import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../env.js';

/**
 * Sends an image file to the AI microservice and returns a normalized result.
 * Never throws for "service down" — returns { ok: false, error } so callers can
 * persist a FAILED AiResult and let the UI degrade gracefully.
 */
export async function analyzeImage(absFilePath, mime = 'image/png') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.aiTimeoutMs);
  const startedAt = Date.now();

  try {
    const buf = await fs.readFile(absFilePath);
    const form = new FormData();
    const blob = new Blob([buf], { type: mime });
    form.append('file', blob, path.basename(absFilePath));

    const res = await fetch(`${env.aiServiceUrl}/predict`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `AI service ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    return {
      ok: true,
      prediction: data.prediction === 'ABNORMAL' ? 'ABNORMAL' : 'NORMAL',
      label:
        data.label ||
        (data.prediction === 'ABNORMAL'
          ? 'Possible abnormality detected'
          : 'No abnormality detected'),
      confidence: typeof data.confidence === 'number' ? data.confidence : null,
      modelName: data.model_name || 'unknown',
      modelVersion: data.model_version || 'unknown',
      inferenceMs: data.inference_ms ?? Date.now() - startedAt,
    };
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'AI service timed out' : String(err.message || err);
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

export async function aiHealth() {
  try {
    const res = await fetch(`${env.aiServiceUrl}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { up: false };
    return { up: true, ...(await res.json().catch(() => ({}))) };
  } catch {
    return { up: false };
  }
}
