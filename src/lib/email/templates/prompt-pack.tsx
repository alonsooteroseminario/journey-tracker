import { Button, Hr, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./base-layout";
import { PROMPT_PACK } from "@/lib/social/promptPack";

const SITE = process.env.NEXT_PUBLIC_APP_URL ?? "https://buildcadence.co";

/**
 * The lead magnet. Delivered by email so the address is confirmed, and also
 * readable at /prompt-pack so a bounced or delayed send never means the visitor
 * got nothing for their address.
 */
export function PromptPackEmail() {
  return (
    <BaseLayout preview="The seven prompts, and the reason you keep rewriting them">
      <Text style={h1}>Seven prompts worth keeping</Text>
      <Text style={p}>
        These are the ones people rewrite most. Not because they forgot how to write them,
        but because version six was somewhere in a chat log.
      </Text>

      {PROMPT_PACK.map((prompt, i) => (
        <Text key={prompt} style={item}>
          <span style={num}>{String(i + 1).padStart(2, "0")}</span>
          {prompt}
        </Text>
      ))}

      <Hr style={hr} />
      <Text style={p}>
        The writing was never the hard part. Finding it again was.
      </Text>
      <Button href={`${SITE}/prompt-pack`} style={button}>
        Read them on the web
      </Button>
      <Text style={small}>
        Reply and tell us which number is yours. Every reply is read.
      </Text>
    </BaseLayout>
  );
}

const h1 = { fontSize: "24px", fontWeight: 700, color: "#1A1726", margin: "0 0 12px" };
const p = { fontSize: "15px", lineHeight: "24px", color: "#3f3d56", margin: "0 0 16px" };
const item = { fontSize: "15px", lineHeight: "23px", color: "#1A1726", margin: "0 0 12px" };
const num = { color: "#5B50E8", fontWeight: 700, marginRight: "10px" };
const hr = { borderColor: "#e8e6f5", margin: "24px 0" };
const button = {
  backgroundColor: "#5B50E8",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 22px",
  borderRadius: "10px",
  textDecoration: "none",
};
const small = { fontSize: "13px", color: "#6b6980", margin: "20px 0 0" };
