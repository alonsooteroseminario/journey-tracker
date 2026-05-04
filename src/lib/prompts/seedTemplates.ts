export interface SeedTemplate {
  title: string;
  icon: string;
  description: string;
}

export const SEED_TEMPLATES: SeedTemplate[] = [
  {
    title: 'Coding Prompts',
    icon: '🧠',
    description: 'System prompts and coding helpers',
  },
  {
    title: 'Email Templates',
    icon: '✉️',
    description: 'Professional email templates',
  },
  {
    title: 'Marketing Copy',
    icon: '📣',
    description: 'Marketing and copywriting prompts',
  },
];
