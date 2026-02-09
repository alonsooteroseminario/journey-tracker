import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface GoalForkedEmailProps {
  userName: string;
  goalTitle: string;
  goalIcon?: string;
  forkerName: string;
  totalForks: number;
}

export function GoalForkedEmail({ userName, goalTitle, goalIcon, forkerName, totalForks }: GoalForkedEmailProps) {
  return (
    <BaseLayout preview={`${forkerName} forked your template!`}>
      <Heading style={heading}>
        {goalIcon && <span style={{ marginRight: "8px" }}>{goalIcon}</span>}
        Someone Forked Your Template! 🎉
      </Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        Great news! <strong>{forkerName}</strong> has forked your goal template "<strong>{goalTitle}</strong>" and is starting their own journey!
      </Text>
      <Text style={paragraph}>
        Your template has now been forked <strong>{totalForks} {totalForks === 1 ? "time" : "times"}</strong>.
        You're helping others achieve their goals by sharing your experience!
      </Text>
      <Text style={paragraph}>
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/templates`} style={button}>
          View Your Templates
        </Link>
      </Text>
      <Text style={paragraph}>
        Keep sharing your journey! 🌟
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
