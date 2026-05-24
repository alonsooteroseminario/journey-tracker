import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface StreakMilestoneEmailProps {
  userName: string;
  streakCount: number;
}

export function StreakMilestoneEmail({ userName, streakCount }: StreakMilestoneEmailProps) {
  const getMessage = (streak: number) => {
    if (streak >= 100) return "🏆 Legendary! You're a goal-crushing champion!";
    if (streak >= 60) return "💎 Diamond streak! Your dedication is incredible!";
    if (streak >= 30) return "🌟 30 days strong! You're building an amazing habit!";
    if (streak >= 14) return "⚡ Two weeks in a row! Keep the momentum going!";
    if (streak >= 7) return "🔥 One week streak! You're on fire!";
    return "🎯 Milestone reached!";
  };

  return (
    <BaseLayout preview={`${streakCount}-day streak milestone!`}>
      <Heading style={heading}>{getMessage(streakCount)}</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        Congratulations! You've reached a <strong>{streakCount}-day streak</strong> on Cadence! 🎉
      </Text>
      <Text style={paragraph}>
        Your consistency is paying off. Every day you show up is another step toward your goals.
      </Text>
      <Text style={paragraph}>
        <Link href={process.env.NEXT_PUBLIC_APP_URL} style={button}>
          View Your Progress
        </Link>
      </Text>
      <Text style={paragraph}>
        Keep up the amazing work!
      </Text>
    </BaseLayout>
  );
}

const heading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  marginTop: "0",
  marginBottom: "16px",
  color: "#1a1a2e",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#525f7f",
  marginTop: "0",
  marginBottom: "16px",
};

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  marginTop: "8px",
};
