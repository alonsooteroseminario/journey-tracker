import { describe, it, expect } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { trimMessages } from './trimMessages';

type Msg = Anthropic.Messages.MessageParam;

const user = (text: string): Msg => ({ role: 'user', content: text });

const assistantToolUse = (id: string): Msg => ({
  role: 'assistant',
  content: [{ type: 'tool_use', id, name: 'get-goals', input: {} }],
});

const userToolResult = (id: string): Msg => ({
  role: 'user',
  content: [{ type: 'tool_result', tool_use_id: id, content: '[]' }],
});

/** A tool_result message may never lead the trimmed history — the API 400s. */
const leadsWithToolResult = (msgs: Msg[]) =>
  msgs.slice(1).length > 0 &&
  Array.isArray(msgs[1].content) &&
  msgs[1].content.some((b) => typeof b === 'object' && b !== null && b.type === 'tool_result');

describe('trimMessages', () => {
  it('leaves short conversations untouched', () => {
    const msgs = [user('hi'), assistantToolUse('a'), userToolResult('a')];
    expect(trimMessages(msgs)).toEqual(msgs);
  });

  it('always keeps the original user message first', () => {
    const msgs: Msg[] = [user('original')];
    for (let i = 0; i < 20; i++) {
      msgs.push(assistantToolUse(`t${i}`), userToolResult(`t${i}`));
    }
    const out = trimMessages(msgs);
    expect(out[0]).toBe(msgs[0]);
    expect(out[0].content).toBe('original');
  });

  it('never starts the trimmed history on an orphaned tool_result', () => {
    // Build lengths that make a blind slice(-12) land mid-pair.
    for (let n = 15; n <= 40; n++) {
      const msgs: Msg[] = [user('original')];
      for (let i = 0; msgs.length < n; i++) {
        msgs.push(assistantToolUse(`t${i}`), userToolResult(`t${i}`));
      }
      const out = trimMessages(msgs);
      expect(leadsWithToolResult(out), `orphaned tool_result at length ${n}`).toBe(false);
    }
  });

  it('fixes the lengths where a blind slice would have orphaned a tool_result', () => {
    const orphanedByBlindSlice: number[] = [];

    for (let n = 15; n <= 40; n++) {
      const msgs: Msg[] = [user('original')];
      for (let i = 0; msgs.length < n; i++) {
        msgs.push(assistantToolUse(`t${i}`), userToolResult(`t${i}`));
      }
      msgs.length = n; // exact length, so the cut lands at every offset in turn

      if (leadsWithToolResult([msgs[0], ...msgs.slice(-12)])) {
        orphanedByBlindSlice.push(n);
        expect(leadsWithToolResult(trimMessages(msgs)), `still orphaned at ${n}`).toBe(false);
      }
    }

    // Guard against the test silently passing because it never hit the bug.
    expect(orphanedByBlindSlice.length).toBeGreaterThan(0);
  });

  it('keeps every tool_result paired with its tool_use', () => {
    const msgs: Msg[] = [user('original')];
    for (let i = 0; i < 12; i++) {
      msgs.push(assistantToolUse(`t${i}`), userToolResult(`t${i}`));
    }
    const out = trimMessages(msgs);
    const openIds = new Set<string>();
    for (const m of out) {
      if (!Array.isArray(m.content)) continue;
      for (const b of m.content) {
        if (typeof b !== 'object' || b === null) continue;
        if (b.type === 'tool_use') openIds.add(b.id);
        if (b.type === 'tool_result') {
          expect(openIds.has(b.tool_use_id), `unpaired tool_result ${b.tool_use_id}`).toBe(true);
        }
      }
    }
  });
});
