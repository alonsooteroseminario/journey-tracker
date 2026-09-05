"use client";

import { useEffect, useState } from "react";
import { captureAttribution, readAttribution } from "@/lib/utm";

type State = "idle" | "sending" | "done" | "error";

/**
 * The only way to reach a visitor who is interested but not ready to sign up.
 * Posts 01 to 06 of the launch never name the product, so someone convinced by
 * a post has nowhere to go for a fortnight; this catches that intent without
 * breaking the rule.
 */
export function EmailCapture({
  source = "landing",
  className = "",
}: {
  source?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [emailed, setEmailed] = useState(false);

  // First touch wins, so this has to run on arrival, not at submit.
  useEffect(() => captureAttribution(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");

    try {
      const res = await fetch("/api/email-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, ...readAttribution() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(json.error ?? "Something went wrong, try again");
        return;
      }
      setEmailed(Boolean(json.emailed));
      setState("done");
    } catch {
      setState("error");
      setMessage("Network problem, try again");
    }
  }

  if (state === "done") {
    return (
      <div className={`rounded-xl bg-brand-light/60 border border-brand-primary/20 px-5 py-4 ${className}`}>
        <p className="text-sm font-semibold text-brand-primary">
          {emailed ? "Check your inbox." : "You are on the list."}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {emailed ? "The pack is on its way. " : ""}
          Read the seven prompts{" "}
          <a href="/prompt-pack" className="underline font-medium text-brand-primary">
            right here
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="email-capture" className="sr-only">
          Email address
        </label>
        <input
          id="email-capture"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@work.com"
          autoComplete="email"
          className="flex-1 px-4 py-3 text-base rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="px-6 py-3 text-base font-semibold bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-colors disabled:opacity-60"
        >
          {state === "sending" ? "Sending" : "Send me the pack"}
        </button>
      </div>
      {state === "error" && (
        <p role="alert" className="text-sm text-red-600 mt-2">
          {message}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Seven prompts worth keeping. No account needed, unsubscribe any time.
      </p>
    </form>
  );
}
