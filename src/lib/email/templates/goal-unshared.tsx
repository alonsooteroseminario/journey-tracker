import { Text, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface GoalUnsharedEmailProps {
  userName: string;
  goalTitle: string;
}

export function GoalUnsharedEmail({ userName, goalTitle }: GoalUnsharedEmailProps) {
  return (
    <BaseLayout preview={`Template removed: ${goalTitle}`}>
      <Heading style={heading}>Template Sharing Stopped</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        Your goal template "<strong>{goalTitle}</strong>" is no longer being shared.
      </Text>
      <Text style={paragraph}>
        It has been removed from your shared templates list and is no longer visible to your friends or in the marketplace.
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
