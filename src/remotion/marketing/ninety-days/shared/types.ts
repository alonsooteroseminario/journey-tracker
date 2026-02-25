export type VideoFormat = "landscape" | "square" | "vertical";

export interface TaskData {
  title: string;
  status: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high" | "critical";
  substeps?: number;
  phase?: number;
}

export interface FeedItemData {
  initials: string;
  avatarColor: string;
  name: string;
  action: string;
  goalEmoji: string;
  timestamp: string;
  isUser?: boolean;
}

export interface TemplateData {
  category: string;
  categoryColor: string;
  categoryBg: string;
  title: string;
  emoji: string;
  author: string;
  authorInitials: string;
  forks: number;
  difficulty: string;
  difficultyColor: string;
  difficultyBg: string;
}
