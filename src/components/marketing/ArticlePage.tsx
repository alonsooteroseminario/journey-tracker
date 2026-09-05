import Link from "next/link";
import { EmailCapture } from "@/components/EmailCapture";

/**
 * Layout for the public search-surface pages.
 *
 * These exist because the launch was 100% social and 0% search, for a problem
 * people actively type into Google. Social reach stops when posting stops.
 * Every page ends with the same capture form, so search traffic feeds the same
 * list the Instagram bio link does.
 *
 * Pinned light like `LandingPage`: these are marketing surfaces, not app chrome.
 */
export function ArticlePage({
  title,
  standfirst,
  updated,
  children,
}: {
  title: string;
  standfirst: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div data-theme="light" style={{ colorScheme: "light" }} className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-icon.png" alt="" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-lg font-bold text-brand-primary tracking-tight">Prompt Wallet</span>
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 text-sm font-semibold bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-950 tracking-tight leading-[1.08]">
          {title}
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-gray-600 leading-relaxed">{standfirst}</p>
        <p className="mt-4 text-sm text-gray-400">Updated {updated}</p>

        <div className="mt-10 prose-page">{children}</div>
      </article>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-950">The seven prompts, free</h2>
          <p className="mt-2 text-gray-600">
            The ones people rewrite most. No account needed.
          </p>
          <EmailCapture source="article" className="mt-5" />
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Prompt Wallet</Link>
          <Link href="/how-to-organize-ai-prompts" className="hover:text-gray-700">Organize your prompts</Link>
          <Link href="/prompt-library-vs-chat-history" className="hover:text-gray-700">Library vs chat history</Link>
          <Link href="/prompt-manager-alternatives" className="hover:text-gray-700">Alternatives</Link>
          <Link href="/prompt-pack" className="hover:text-gray-700">The prompt pack</Link>
        </div>
      </footer>
    </div>
  );
}

/** Section heading, so the three pages keep one hierarchy for crawlers. */
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight mt-12 mb-4">{children}</h2>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-lg text-gray-700 leading-relaxed mb-5">{children}</p>;
}

export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-lg text-gray-900 leading-relaxed mb-5 border-l-4 border-brand-primary pl-5 font-medium">
      {children}
    </p>
  );
}
