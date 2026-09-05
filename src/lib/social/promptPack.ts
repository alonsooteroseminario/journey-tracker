/**
 * The lead magnet, in one place.
 *
 * Same seven prompts as Instagram post 02 (`docs/brand/posts/post-02.md`),
 * which ships them as a carousel on 2026-09-07. Giving them away in exchange
 * for an address costs nothing that was not already being given away, and it
 * turns nine posts of planned reach into an audience that survives the
 * platform.
 *
 * Read by the /prompt-pack page, the delivery email, and the
 * how-to-organize-ai-prompts article, so the list never drifts between them.
 */
export const PROMPT_PACK = [
  "Rewrite this so it sounds like me, not like AI.",
  "Explain what actually causes this error, not how to silence it.",
  "Turn this thread into decisions and owners.",
  "Review this like a senior engineer who has to maintain it.",
  "Give me five options, ranked, with the tradeoff for each.",
  "Turn these notes into a draft I can edit, not a finished piece.",
  "Ask me questions until you have enough to write this properly.",
] as const;
