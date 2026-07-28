import "server-only";

type ProviderAttempt<T> = {
  provider: string;
  run: () => Promise<T>;
};

const state = globalThis as typeof globalThis & {
  __azminAiCooldowns?: Map<string, number>;
};
const cooldowns = state.__azminAiCooldowns ?? new Map<string, number>();
state.__azminAiCooldowns = cooldowns;

export async function runProviderChain<T>(attempts: ProviderAttempt<T>[]) {
  const failed: string[] = [];
  for (const attempt of attempts) {
    const cooldownUntil = cooldowns.get(attempt.provider) ?? 0;
    if (cooldownUntil > Date.now()) {
      failed.push(attempt.provider);
      continue;
    }
    try {
      const value = await attempt.run();
      cooldowns.delete(attempt.provider);
      return { value, provider: attempt.provider, failed };
    } catch (error) {
      failed.push(attempt.provider);
      cooldowns.set(attempt.provider, Date.now() + 15 * 60_000);
      console.warn(`AI provider ${attempt.provider} failed`, {
        message: error instanceof Error ? error.message : "Unknown provider error",
      });
    }
  }
  throw new Error("AI_PROVIDER_CHAIN_UNAVAILABLE");
}
