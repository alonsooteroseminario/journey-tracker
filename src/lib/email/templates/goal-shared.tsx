import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface GoalSharedEmailProps {
  userName: string;
  goalTitle: string;
  goalIcon?: string;
}

export function GoalSharedEmail({ userName, goalTitle, goalIcon }: GoalSharedEmailProps) {
  return (
    <BaseLayout preview={`Goal shared: ${goalTitle}`}>
      <Heading style={heading}>
        {goalIcon && <span style={{ marginRight: "8px" }}>{goalIcon}</span>}
        Goal Template Shared!
      </Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        Your goal "<strong>{goalTitle}</strong>" has been successfully shared as a template with your friends!
      </Text>
      <Text style={paragraph}>
        Your friends can now view this template and fork it to create their own version of your goal.
      </Text>
      <Text style={paragraph}>
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/templates`} style={button}>
          View Shared Templates
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
