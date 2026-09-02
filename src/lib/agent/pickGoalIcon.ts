/**
 * AI-powered goal icon picker.
 * Calls Claude with a tight prompt to select one emoji from a curated set.
 * Falls back to DEFAULT_ICON on any error so it never blocks goal creation.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AGENT_MODEL } from './model';

export const EMOJI_SET = [
  '🎯', '🏃', '📚', '💼', '🏠', '💰', '🎨', '🏋️', '🌱', '🚀',
  '✈️', '🎮', '🍽️', '🎵', '📖', '💪', '🌍', '🎓', '🏥', '🚗',
  '🏖️', '👨‍👩‍👧', '🐾', '💻', '🔬', '🎬', '🏆', '⚽', '🌺', '🍁',
  '🎤', '🏔️', '🌊', '🎭', '📝', '🧘', '🔧', '🎹', '🌙', '☀️',
  '🧠', '💎', '🍎', '🎪',
];

export const DEFAULT_ICON = '🎯';

/**
 * Pick an emoji icon for a goal.
 * @param title       Goal title (used when no hint is provided)
 * @param description Goal description (used when no hint is provided)
 * @param hint        Free-text override — e.g. "something related to travel"
 */
export async function pickGoalIcon(
  title: string,
  description?: string | null,
  hint?: string,
  userApiKey?: string | null
): Promise<string> {
  try {
    const resolvedKey = userApiKey || process.env.ANTHROPIC_API_KEY || '';
    if (!resolvedKey) return DEFAULT_ICON;
    const client = new Anthropic({ apiKey: resolvedKey });

    const context = hint
      ? `The user wants an icon that represents: ${hint}`
      : `Goal title: "${title}"${description ? `\nGoal description: "${description}"` : ''}`;

    const response = await client.messages.create({
      model: AGENT_MODEL,
      max_tokens: 5,
      messages: [
        {
          role: 'user',
          content:
            'Pick exactly ONE emoji from this list that best represents the goal.\n\n' +
            `Available emojis: ${EMOJI_SET.join(' ')}\n\n` +
            context +
            '\n\nReply with ONLY the single emoji, nothing else.',
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    // Match the first emoji from our allowed set that appears in the response
    const match = EMOJI_SET.find((e) => text.startsWith(e));
    return match || DEFAULT_ICON;
  } catch {
    return DEFAULT_ICON;
  }
}
