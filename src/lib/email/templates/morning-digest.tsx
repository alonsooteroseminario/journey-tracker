import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface MorningDigestEmailProps {
  userName: string;
  overdueCount: number;
  todayTaskCount: number;
  streakCount: number;
  aiParagraph?: string;
}

export function MorningDigestEmail({
  userName,
  overdueCount,
  todayTaskCount,
  streakCount,
  aiParagraph,
}: MorningDigestEmailProps) {
  return (
    <BaseLayout preview={`Good morning ${userName} — your Cadence digest`}>
      <Heading style={heading}>Good morning, {userName} ☀️</Heading>

      {aiParagraph && (
        <Text style={aiText}>{aiParagraph}</Text>
      )}

      <Text style={statsHeader}><strong>Today at a glance:</strong></Text>

      <Text style={statRow}>
        {overdueCount > 0
          ? `⚠️ ${overdueCount} overdue task${overdueCount !== 1 ? "s" : ""} need attention`
          : "✅ No overdue tasks — you're on track"}
      </Text>
      <Text style={statRow}>
        📋 {todayTaskCount} task{todayTaskCount !== 1 ? "s" : ""} due today
      </Text>
      <Text style={statRow}>
        🔥 {streakCount}-day streak
      </Text>

      <Text style={paragraph}>
        <Link href={process.env.NEXT_PUBLIC_APP_URL || "https://buildcadence.co"} style={button}>
          Open Cadence
        </Link>
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

const aiText = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#2D1B8E",
  backgroundColor: "#EAE8FF",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
  fontStyle: "italic" as const,
};

const statsHeader = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#525f7f",
  marginTop: "0",
  marginBottom: "8px",
};

const statRow = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#525f7f",
  marginTop: "0",
  marginBottom: "8px",
  paddingLeft: "8px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#525f7f",
  marginTop: "16px",
  marginBottom: "0",
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
