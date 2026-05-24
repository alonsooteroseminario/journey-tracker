import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

interface ProfileChangedEmailProps {
  userName: string;
  changedFields: string[];
}

export function ProfileChangedEmail({ userName, changedFields }: ProfileChangedEmailProps) {
  return (
    <BaseLayout preview="Your profile has been updated">
      <Heading style={heading}>Profile Updated</Heading>
      <Text style={paragraph}>Hi {userName},</Text>
      <Text style={paragraph}>
        Your Cadence profile has been successfully updated.
      </Text>
      <Text style={paragraph}>
        <strong>Changes made:</strong>
      </Text>
      {changedFields.map((field, index) => (
        <Text key={index} style={listItem}>• {field}</Text>
      ))}
      <Text style={paragraph}>
        If you didn't make these changes, please{" "}
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/profile`} style={link}>
          review your profile
        </Link>{" "}
        immediately.
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
};

const link = {
  color: "#4f46e5",
  textDecoration: "underline",
};
