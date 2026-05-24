import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface OverdueAlertEmailProps {
  userName: string;
  taskTitle: string;
  goalTitle: string;
  daysOverdue: number;
  aiContext?: string;
}

export function OverdueAlertEmail({
  userName,
  taskTitle,
  goalTitle,
  daysOverdue,
  aiContext,
}: OverdueAlertEmailProps) {
  const dayLabel = daysOverdue === 1 ? "1 day" : `${daysOverdue} days`;

  return (
    <BaseLayout preview={`Overdue: ${taskTitle}`}>
      <Heading style={heading}>Task overdue ⚠️</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        <strong>{taskTitle}</strong> is {dayLabel} overdue. It's part of your goal:{" "}
        <strong>{goalTitle}</strong>.
      </Text>

      {aiContext && (
        <Text style={aiText}>{aiContext}</Text>
      )}

      <Text style={paragraph}>
        <Link href={process.env.NEXT_PUBLIC_APP_URL || "https://buildcadence.co"} style={button}>
          Complete it now
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

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#525f7f",
  marginTop: "0",
  marginBottom: "16px",
};

const aiText = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#2D1B8E",
  backgroundColor: "#EAE8FF",
  borderRadius: "8px",
  padding: "14px 16px",
  marginBottom: "16px",
  fontStyle: "italic" as const,
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
  marginTop: "4px",
};
