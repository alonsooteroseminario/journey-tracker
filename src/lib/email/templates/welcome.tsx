import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface WelcomeEmailProps {
  userName: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <BaseLayout preview="Welcome to Cadence!">
      <Heading style={heading}>Welcome to Cadence!</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        We're excited to have you on board! Cadence helps you break down your goals into actionable tasks,
        track your progress, and stay motivated with daily streaks.
      </Text>
      <Text style={paragraph}>
        <strong>Here's what you can do:</strong>
      </Text>
      <Text style={listItem}>✅ Create goals and break them into tasks and substeps</Text>
      <Text style={listItem}>🔥 Build daily streaks by completing tasks</Text>
      <Text style={listItem}>👥 Connect with friends and share your progress</Text>
      <Text style={listItem}>🤖 Use the AI assistant to help plan and manage your goals</Text>
      <Text style={paragraph}>
        <Link href={process.env.NEXT_PUBLIC_APP_URL || "https://buildcadence.co"} style={button}>
          Get Started
        </Link>
      </Text>
      <Text style={paragraph}>
        Happy goal tracking!<br />
        The Cadence Team
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

const listItem = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#525f7f",
  marginTop: "0",
  marginBottom: "8px",
  paddingLeft: "8px",
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
