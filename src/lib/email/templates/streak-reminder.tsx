import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface StreakReminderEmailProps {
  userName: string;
  currentStreak: number;
  aiContext?: string;
}

export function StreakReminderEmail({ userName, currentStreak, aiContext }: StreakReminderEmailProps) {
  return (
    <BaseLayout preview="Don't break your streak!">
      <Heading style={heading}>🔥 Keep Your Streak Alive!</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        You have a <strong>{currentStreak}-day streak</strong> going! Don't let it break today.
      </Text>
      <Text style={paragraph}>
        Complete at least one task or substep to keep your streak alive. Even small progress counts!
      </Text>
      {aiContext && <Text style={aiContextStyle}>{aiContext}</Text>}
      <Text style={paragraph}>
        <Link href={process.env.NEXT_PUBLIC_APP_URL} style={button}>
          Complete a Task
        </Link>
      </Text>
      <Text style={paragraph}>
        You've got this! 💪
      </Text>
      <Text style={unsubscribeNote}>
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL || "https://buildcadence.co"}/settings/notifications`} style={unsubscribeLink}>
          Manage email preferences
        </Link>
      </Text>
    </BaseLayout>
  );
}

const aiContextStyle = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#525f7f",
  fontStyle: "italic" as const,
  borderTop: "1px solid #eae8ff",
  paddingTop: "16px",
  marginTop: "0",
  marginBottom: "16px",
};

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

const unsubscribeNote = {
  fontSize: "12px",
  color: "#aaa",
  marginTop: "20px",
  lineHeight: "18px",
};

const unsubscribeLink = {
  color: "#888",
  textDecoration: "underline",
};

const button = {
  backgroundColor: "#5B50E8",
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
