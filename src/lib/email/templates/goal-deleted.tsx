import { Text, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface GoalDeletedEmailProps {
  userName: string;
  goalTitle: string;
}

export function GoalDeletedEmail({ userName, goalTitle }: GoalDeletedEmailProps) {
  return (
    <BaseLayout preview={`Goal deleted: ${goalTitle}`}>
      <Heading style={heading}>Goal Deleted</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        Your goal "<strong>{goalTitle}</strong>" has been deleted.
      </Text>
      <Text style={paragraph}>
        All tasks and progress associated with this goal have been removed.
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
