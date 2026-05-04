export interface SeedChunk {
  title: string;
  content: string;
}

export interface SeedGroup {
  title: string;
  description?: string;
  chunks: SeedChunk[];
}

export interface SeedWallet {
  title: string;
  icon: string;
  description: string;
  groups: SeedGroup[];
}

export const SEED_TEMPLATES: SeedWallet[] = [
  {
    title: 'Coding Prompts',
    icon: '🧠',
    description: 'Reusable system prompts and review snippets for coding tasks',
    groups: [
      {
        title: 'System role',
        chunks: [
          {
            title: 'Senior engineer',
            content:
              'You are a senior software engineer with 15+ years of experience. Be precise, terse, and pragmatic. Prefer simple, correct solutions over clever ones.',
          },
          {
            title: 'TDD-first',
            content:
              'Write the failing test first. Then write the smallest implementation that makes it pass. Then refactor. Never write implementation before the test.',
          },
        ],
      },
      {
        title: 'Code review',
        chunks: [
          {
            title: 'Review for safety',
            content:
              'Review the diff for: SQL injection, input validation at trust boundaries, error handling on external calls, missing auth checks, and secrets in code.',
          },
          {
            title: 'Review for clarity',
            content:
              'Review for naming, function size (<20 lines), single responsibility, duplication, and whether any logic belongs in a better layer.',
          },
        ],
      },
    ],
  },
  {
    title: 'Email Templates',
    icon: '✉️',
    description: 'Common professional email scaffolds',
    groups: [
      {
        title: 'Outreach',
        chunks: [
          {
            title: 'Cold intro',
            content:
              "Hi [Name],\n\nI came across [context] and wanted to reach out because [specific reason relevant to them].\n\n[One sentence value prop.]\n\nWould you be open to a 20-minute call this week?\n\n[Your name]",
          },
          {
            title: 'Follow-up',
            content:
              "Hi [Name],\n\nFollowing up on my email from [date]. I know you're busy — just wanted to make sure it didn't get buried.\n\n[One-line restate of ask.]\n\nHappy to work around your schedule.\n\n[Your name]",
          },
        ],
      },
      {
        title: 'Internal',
        chunks: [
          {
            title: 'Status update',
            content:
              "**Status update — [Project/Feature] — [Date]**\n\n✅ Done this week: [bullet list]\n🔄 In progress: [bullet list]\n⚠️ Blockers: [bullet list or 'None']\n📅 Next: [bullet list]",
          },
          {
            title: 'Meeting request',
            content:
              "Hi [Name],\n\nCould we find 30 minutes this week to discuss [topic]? I'd like to cover:\n\n1. [Point 1]\n2. [Point 2]\n3. [Point 3]\n\nI'm free [times]. Let me know what works.\n\n[Your name]",
          },
        ],
      },
    ],
  },
  {
    title: 'Marketing Copy',
    icon: '📣',
    description: 'Reusable marketing and copywriting chunks',
    groups: [
      {
        title: 'Social media',
        chunks: [
          {
            title: 'Twitter thread opener',
            content:
              'A thread on [topic] that most people get wrong:\n\n[Bold claim or counterintuitive statement.]\n\nHere\'s what actually works: 🧵',
          },
          {
            title: 'LinkedIn post',
            content:
              '[Hook — one punchy sentence.]\n\n[Story or insight in 3–5 short paragraphs.]\n\n[Takeaway or question to drive comments.]\n\n#[Tag1] #[Tag2]',
          },
        ],
      },
      {
        title: 'Product',
        chunks: [
          {
            title: 'Feature announcement',
            content:
              "🎉 Introducing [Feature Name]\n\n[One sentence: what it does and who it's for.]\n\n**What's new:**\n- [Benefit 1]\n- [Benefit 2]\n- [Benefit 3]\n\n[CTA — try it / read more / watch demo]",
          },
          {
            title: 'Call to action',
            content:
              '[Outcome the reader wants]. [How your product delivers it]. [Social proof or urgency].\n\n[Primary CTA button text] →',
          },
        ],
      },
    ],
  },
];
