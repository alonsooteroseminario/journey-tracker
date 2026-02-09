import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface GoalPublishedEmailProps {
  userName: string;
  goalTitle: string;
  goalIcon?: string;
}

export function GoalPublishedEmail({ userName, goalTitle, goalIcon }: GoalPublishedEmailProps) {
  return (
    <BaseLayout preview={`Goal template published: ${goalTitle}`}>
      <Heading style={heading}>
        {goalIcon && <span style={{ marginRight: "8px" }}>{goalIcon}</span>}
        Template Published to Marketplace! 🎉
      </Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        Your goal template "<strong>{goalTitle}</strong>" has been published to the Journey Tracker Marketplace!
      </Text>
      <Text style={paragraph}>
        Others can now discover and fork your template to follow the same journey you've mapped out.
        Your experience and lessons learned will help others achieve similar goals!
      </Text>
      <Text style={paragraph}>
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/marketplace`} style={button}>
          View in Marketplace
        </Link>
      </Text>
      <Text style={paragraph}>
        Thank you for sharing your journey! 🌟
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
