import { Text, Link, Heading } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";

export interface ReminderTask {
  title: string;
  goalTitle: string;
  dueDate?: string;
}

interface TaskReminderDigestEmailProps {
  userName: string;
  tasks: ReminderTask[];
}

export function TaskReminderDigestEmail({
  userName,
  tasks,
}: TaskReminderDigestEmailProps) {
  return (
    <BaseLayout preview={`Your daily reminder — ${tasks.length} task${tasks.length !== 1 ? "s" : ""} waiting`}>
      <Heading style={heading}>Your daily reminder 🔔</Heading>

      <Text style={intro}>
        Hey {userName}, here are the tasks you flagged for a daily nudge:
      </Text>

      {tasks.map((task, i) => (
        <div key={i} style={taskRow}>
          <Text style={taskTitle}>☐ {task.title}</Text>
          <Text style={goalLabel}>{task.goalTitle}{task.dueDate ? ` · due ${new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</Text>
        </div>
      ))}

      <Text style={footer}>
        <Link href={process.env.NEXT_PUBLIC_APP_URL || "https://buildcadence.co"} style={button}>
          Open Cadence
        </Link>
      </Text>

      <Text style={unsubscribeNote}>
        To stop these reminders, click the bell icon on each task or{" "}
        <Link href={`${process.env.NEXT_PUBLIC_APP_URL || "https://buildcadence.co"}/settings/notifications`} style={unsubscribeLink}>
          manage your email preferences
        </Link>.
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

const intro = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#525f7f",
  marginTop: "0",
  marginBottom: "16px",
};

const taskRow = {
  borderLeft: "3px solid #5B50E8",
  paddingLeft: "12px",
  marginBottom: "12px",
};

const taskTitle = {
  fontSize: "15px",
  fontWeight: "600" as const,
  color: "#1a1a2e",
  margin: "0 0 2px 0",
};

const goalLabel = {
  fontSize: "13px",
  color: "#888",
  margin: "0",
};

const footer = {
  marginTop: "24px",
  marginBottom: "0",
};

const button = {
  backgroundColor: "#5B50E8",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const unsubscribeNote = {
  fontSize: "12px",
  color: "#aaa",
  marginTop: "20px",
  lineHeight: "18px",
};

const unsubscribeLink = {
  color: "#888",
  textDecoration: "underline",
};
