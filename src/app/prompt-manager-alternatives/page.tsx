import type { Metadata } from "next";
import Link from "next/link";
import { ArticlePage, H2, P, Callout } from "@/components/marketing/ArticlePage";

export const metadata: Metadata = {
  title: "Where people keep AI prompts, and where it breaks",
  description:
    "Notes apps, Notion databases, scratch files, and the tool's own saved prompts. An honest look at what each one is good at and where each one fails.",
  alternates: { canonical: "/prompt-manager-alternatives" },
};

const OPTIONS = [
  {
    name: "A notes app",
    good: "Zero setup, always open, syncs everywhere. For under about twenty prompts this is genuinely fine and you should not replace it.",
    breaks:
      "There is no structure, so finding one means scrolling or searching for words you may not remember. And a prompt is stored whole, so reusing half of it means editing the other half every time.",
  },
  {
    name: "A Notion database",
    good: "Real structure. Tags, properties, filtered views, and it scales past a few hundred rows without falling over.",
    breaks:
      "It asks you to file things. Every prompt needs a title, a tag, a category, and that upkeep is what people quietly abandon around week three. Copying a prompt out is also several clicks away from the tool you are actually working in.",
  },
  {
    name: "A scratch file",
    good: "Fast, local, in your editor, versioned if you want it to be.",
    breaks:
      "One long file becomes unsearchable at exactly the point it becomes valuable, and it is on one machine unless you do the work to make it otherwise.",
  },
  {
    name: "The tool's own saved prompts",
    good: "Closest to the point of use. One click from the composer.",
    breaks:
      "It lives inside that product. Switch models next year, which everyone does, and your library does not come with you. It is also usually flat, with no way to reuse a piece of a prompt.",
  },
  {
    name: "A prompt library",
    good: "Built for retrieval rather than filing. Prompts break into reusable chunks, so the parts that never change stop being rewritten.",
    breaks:
      "It is another place to keep something, and it earns that only if you are reusing prompts often enough to feel the cost. If you write a prompt once and never return to it, you do not need one.",
  },
];

export default function Page() {
  return (
    <ArticlePage
      title="Where people keep AI prompts"
      standfirst="Five honest options, including doing nothing. Most people are on the first one and it is working fine until it suddenly is not."
      updated="September 2026"
    >
      <P>
        Every option below is a real system that real people run. The question is not which
        is best, it is which one breaks first for the way you work.
      </P>

      {OPTIONS.map((o) => (
        <div key={o.name} className="mb-8">
          <H2>{o.name}</H2>
          <P>
            <strong className="text-gray-950">Works because: </strong>
            {o.good}
          </P>
          <P>
            <strong className="text-gray-950">Breaks because: </strong>
            {o.breaks}
          </P>
        </div>
      ))}

      <H2>How to tell which one you need</H2>
      <P>
        Think of the one prompt you would hate to lose. Open whatever you use now, find it,
        and time yourself.
      </P>
      <Callout>
        Under ten seconds, your system works. Near a minute, you do not have a system, you
        have a place things go.
      </Callout>
      <P>
        The number that matters is not how many prompts you have kept. It is how long it
        takes to reach the one you want.{" "}
        <Link href="/how-to-organize-ai-prompts" className="text-brand-primary underline font-medium">
          The four-part method
        </Link>{" "}
        works in any of these tools, including the notes app you already have open.
      </P>
    </ArticlePage>
  );
}
