import type { Metadata } from "next";
import Link from "next/link";
import { ArticlePage, H2, P, Callout } from "@/components/marketing/ArticlePage";

export const metadata: Metadata = {
  title: "How to organize your AI prompts (a system that survives)",
  description:
    "Chat history is a transcript, not a filing system. A four-part method for keeping the prompts that work and reaching them in seconds, with no new habits to maintain.",
  alternates: { canonical: "/how-to-organize-ai-prompts" },
};

export default function Page() {
  return (
    <ArticlePage
      title="How to organize your AI prompts"
      standfirst="Most prompt systems fail because they ask you to file things. This one asks you to break a prompt into the parts you actually reuse."
      updated="September 2026"
    >
      <P>
        You wrote a prompt that worked. Not okay, worked. Three messages deep, fixing the
        output, and the fourth try landed. You copied the result. You did not copy the
        prompt.
      </P>
      <P>
        It is still in there, somewhere behind four hundred conversations. So next week you
        rewrite it from scratch, and you do not start from your last version. You start
        from zero.
      </P>

      <H2>Why chat history does not work</H2>
      <P>
        Chat history is not a filing system. It is a transcript. Transcripts are ordered by
        time, not by usefulness, so your best prompt and a question about a typo carry
        exactly the same weight.
      </P>
      <Callout>
        Search only helps when you already remember the words you used.
      </Callout>
      <P>
        That is the whole failure. Not storage, retrieval. Everything below is about making
        a prompt reachable in seconds, not about keeping more of them.
      </P>

      <H2>Step 1. Keep only the prompts you have reused</H2>
      <P>
        A prompt you wrote once and never returned to is a note, not an asset. The test is
        simple: have you typed something like this more than twice? If yes it belongs in the
        library. If no, let it go. A library of forty prompts you actually use beats four
        hundred you have to search.
      </P>

      <H2>Step 2. Break each prompt into chunks</H2>
      <P>
        This is the step people skip, and it is the one that makes the system hold. Almost
        every working prompt is four parts:
      </P>
      <ul className="space-y-3 mb-6 text-lg text-gray-700">
        <li><strong className="text-gray-950">Role.</strong> Who the model is being. Rarely changes.</li>
        <li><strong className="text-gray-950">Context.</strong> The project, the audience, the constraints you always restate.</li>
        <li><strong className="text-gray-950">Task.</strong> The part that actually changes each time.</li>
        <li><strong className="text-gray-950">Format.</strong> How you want the answer shaped. Rarely changes.</li>
      </ul>
      <P>
        Three of those four are the same every time. Once they are separate pieces you stop
        rewriting them, because you are assembling instead of writing.
      </P>

      <H2>Step 3. Group by the work, not by the tool</H2>
      <P>
        Group prompts by the project or client they belong to, not by which model you were
        using. Models change every few months. The work does not. A group per project keeps
        contexts from bleeding into each other, which is the other reason people abandon
        prompt folders.
      </P>

      <H2>Step 4. Compose, then copy</H2>
      <P>
        When you need a prompt, pick the chunks and paste the result. Role and format come
        along unchanged, context is already written, and you only type the part that is
        genuinely new. That is the difference between a library and a folder: a folder gives
        you a file to open, a library gives you a finished prompt.
      </P>

      <H2>The test</H2>
      <P>
        Think of the one prompt you would hate to lose. Open your tool and find it. Time
        yourself. Most people land near a minute, and a minute is not a memory problem, it
        is a retrieval problem.
      </P>
      <P>
        You do not have a prompt writing problem. You write good prompts. You have a
        retrieval problem, and{" "}
        <Link href="/prompt-library-vs-chat-history" className="text-brand-primary underline font-medium">
          chat history is the reason
        </Link>
        .
      </P>
    </ArticlePage>
  );
}
