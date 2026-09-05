import type { Metadata } from "next";
import Link from "next/link";
import { ArticlePage, H2, P, Callout } from "@/components/marketing/ArticlePage";

export const metadata: Metadata = {
  title: "Prompt library vs chat history: why search is not enough",
  description:
    "Chat history is ordered by time, not usefulness, and search only works when you already remember the words. What a prompt library does differently.",
  alternates: { canonical: "/prompt-library-vs-chat-history" },
};

export default function Page() {
  return (
    <ArticlePage
      title="Prompt library vs chat history"
      standfirst="Chat history is not storage. It is a transcript, and a transcript is the wrong shape for anything you want back."
      updated="September 2026"
    >
      <P>
        Every AI tool keeps your conversations. That feels like storage, so most people
        never build anything else. Then they spend a minute hunting for a prompt they wrote
        last Tuesday.
      </P>

      <H2>Ordered by time, not usefulness</H2>
      <P>
        A transcript records what happened in the order it happened. That is the right shape
        for an audit and the wrong shape for a library. Your best prompt and a question about
        a typo sit next to each other, weighted identically, because the only thing the list
        knows about them is when they arrived.
      </P>

      <H2>Search has a precondition</H2>
      <Callout>
        Search only helps when you already remember the words you used.
      </Callout>
      <P>
        This is the part that surprises people. Searching a chat log for &quot;the one about
        the onboarding email&quot; returns nothing, because you did not write those words.
        You wrote the prompt. Retrieval fails at exactly the moment you need it: when you
        remember the result and not the wording.
      </P>

      <H2>Side by side</H2>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 pr-4 font-semibold text-gray-950">&nbsp;</th>
              <th className="py-3 pr-4 font-semibold text-gray-950">Chat history</th>
              <th className="py-3 font-semibold text-gray-950">Prompt library</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {[
              ["Ordered by", "When you sent it", "What it is for"],
              ["Find something", "Search, if you recall the words", "Open the group, it is there"],
              ["Reuse", "Scroll, copy, edit", "Compose from saved pieces"],
              ["Survives a tool change", "No, it stays in that product", "Yes, it is yours"],
              ["Gets better over time", "No, it only gets longer", "Yes, each fix is kept"],
            ].map(([label, a, b]) => (
              <tr key={label} className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium text-gray-950">{label}</td>
                <td className="py-3 pr-4">{a}</td>
                <td className="py-3">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>The part that actually costs you</H2>
      <P>
        Every rewrite is a first draft. You do not start from your last version, you start
        from zero, and you pay for the same four rounds of fixing you already paid for. Seven
        prompts rewritten five times each is thirty five first drafts of finished work.
      </P>
      <P>
        A library is not a tidier transcript. It is a different object: the prompt is the
        asset, and the chat log is just the receipt.{" "}
        <Link href="/how-to-organize-ai-prompts" className="text-brand-primary underline font-medium">
          Here is how to build one
        </Link>
        .
      </P>
    </ArticlePage>
  );
}
