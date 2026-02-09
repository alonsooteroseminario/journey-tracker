import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface GoalCreatedEmailProps {
  userName: string;
  goalTitle: string;
  goalIcon?: string;
  taskCount: number;
}

export function GoalCreatedEmail({ userName, goalTitle, goalIcon, taskCount }: GoalCreatedEmailProps) {
  return (
    <BaseLayout preview={`New goal created: ${goalTitle}`}>
      <Heading style={heading}>
        {goalIcon && <span style={{ marginRight: "8px" }}>{goalIcon}</span>}
        New Goal Created!
      </Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        You've created a new goal: <strong>{goalTitle}</strong>
      </Text>
      <Text style={paragraph}>
        Your goal has {taskCount} {taskCount === 1 ? "task" : "tasks"} to complete.
        Start making progress today to build your streak!
      </Text>
      <Text style={paragraph}>
        <Link href={process.env.NEXT_PUBLIC_APP_URL} style={button}>
          View Your Goals
        </Link>
      </Text>
      <Text style={paragraph}>
        Good luck on your journey!
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
