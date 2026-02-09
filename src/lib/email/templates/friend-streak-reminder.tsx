import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface FriendStreakReminderEmailProps {
  userName: string;
  friendName: string;
  friendStreak: number;
}

export function FriendStreakReminderEmail({ userName, friendName, friendStreak }: FriendStreakReminderEmailProps) {
  return (
    <BaseLayout preview={`${friendName} needs encouragement!`}>
      <Heading style={heading}>🤝 A Friend Needs Your Support!</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        Your friend <strong>{friendName}</strong> is at risk of losing their {friendStreak}-day streak today!
      </Text>
      <Text style={paragraph}>
        Send them some encouragement to help them stay motivated. A little support can make all the difference!
      </Text>
      <Text style={paragraph}>
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/feed`} style={button}>
          Send Encouragement
        </Link>
      </Text>
      <Text style={paragraph}>
        Friends who support each other succeed together! 🌟
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
