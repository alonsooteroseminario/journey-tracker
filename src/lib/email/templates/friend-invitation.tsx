import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface FriendInvitationEmailProps {
  userName: string;
  invitationCode: string;
}

export function FriendInvitationEmail({ userName, invitationCode }: FriendInvitationEmailProps) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/friends?code=${invitationCode}`;

  return (
    <BaseLayout preview="Friend invitation code created">
      <Heading style={heading}>Share Cadence with Friends!</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        You've created a friend invitation code. Share this with someone you'd like to connect with on Cadence:
      </Text>
      <Text style={codeBlock}>
        <span style={code}>{invitationCode}</span>
      </Text>
      <Text style={paragraph}>
        Or share this direct link:
      </Text>
      <Text style={paragraph}>
        <Link href={inviteUrl} style={link}>
          {inviteUrl}
        </Link>
      </Text>
      <Text style={paragraph}>
        This code expires in 7 days and can only be used once.
      </Text>
      <Text style={paragraph}>
        Once they join, you'll be able to see each other's goals and streaks!
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

const codeBlock = {
  textAlign: "center" as const,
  marginTop: "16px",
  marginBottom: "16px",
};

const code = {
  backgroundColor: "#f4f4f5",
  padding: "16px 24px",
  borderRadius: "6px",
  fontSize: "20px",
  fontWeight: "bold" as const,
  fontFamily: "monospace",
  letterSpacing: "2px",
  color: "#1a1a2e",
};

const link = {
  color: "#4f46e5",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};
