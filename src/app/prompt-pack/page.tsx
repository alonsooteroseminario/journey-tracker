import type { Metadata } from "next";
import { ArticlePage, H2, P, Callout } from "@/components/marketing/ArticlePage";
import { PROMPT_PACK } from "@/lib/social/promptPack";

export const metadata: Metadata = {
  title: "The prompt pack: 7 prompts worth keeping",
  description:
    "Seven AI prompts most people rewrite more than five times, and the reason they keep rewriting them. Free, no account needed.",
  alternates: { canonical: "/prompt-pack" },
};

export default function PromptPackPage() {
  return (
    <ArticlePage
      title="Seven prompts worth keeping"
      standfirst="These are the ones people rewrite most. Copy them, change them, keep them somewhere you can find them again."
      updated="September 2026"
    >
      <P>
        Nothing here is clever. That is the point. Each one is a prompt people retype
        every week because the version that worked is somewhere behind four hundred
        conversations.
      </P>

      <ol className="space-y-4 mb-8">
        {PROMPT_PACK.map((prompt, i) => (
          <li key={prompt} className="rounded-xl bg-gray-900 text-gray-100 p-5">
            <span className="block text-xs font-bold tracking-widest text-brand-secondary mb-2">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-lg leading-relaxed">{prompt}</span>
          </li>
        ))}
      </ol>

      <H2>Why you keep rewriting them</H2>
      <P>
        You did not write these seven times because you forgot how. You wrote them seven
        times because version six was in a chat log, sorted by date, sitting next to a
        question about a typo.
      </P>
      <Callout>
        Seven prompts, five rewrites each, is thirty five first drafts of things you had
        already finished once.
      </Callout>
      <P>
        The fix is not writing better prompts. You already write good ones. The fix is
        being able to reach the one you wrote on Tuesday.
      </P>
    </ArticlePage>
  );
}
