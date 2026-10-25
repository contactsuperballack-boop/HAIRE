import type { ModelProvider } from './agent.types';

interface Input {
  cvText?: string;
  answers?: { question: string; answer: string }[];
  criteria?: { mustHave?: { name: string }[]; preferred?: { name: string }[] };
}

// DEVELOPMENT ONLY. Keyword matching, not intelligence. A mention is INFERRED at best, never VERIFIED.
// The env check refuses to start in production with this provider.
export class MockModelProvider implements ModelProvider {
  readonly modelId = 'mock-keyword-v0';

  async complete(request: { input: unknown }): Promise<unknown> {
    const input = (request.input ?? {}) as Input;
    const text = [input.cvText ?? '', ...(input.answers ?? []).map((a) => a.answer)].join('\n');
    const lower = text.toLowerCase();
    const names = [...(input.criteria?.mustHave ?? []), ...(input.criteria?.preferred ?? [])].map((c) => c.name);

    return {
      claims: names.map((name) => {
        const at = lower.indexOf(name.toLowerCase());
        if (at < 0) return { claim: `${name}`, status: 'UNKNOWN', sourceExcerpt: '' };
        const excerpt = text.slice(Math.max(0, at - 40), at + name.length + 40).trim();
        return { claim: `Mentions ${name}`, status: 'INFERRED', sourceExcerpt: excerpt };
      }),
    };
  }
}
