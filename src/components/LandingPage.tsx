"use client";

import Link from "next/link";

const STEPS = [
  { step: "01", icon: "💼", title: "Create a wallet", desc: "One wallet per project, client, or workflow. Keep contexts from bleeding into each other." },
  { step: "02", icon: "🗂️", title: "Group your prompts", desc: "Organize related prompts into groups inside the wallet. Drag to reorder any time." },
  { step: "03", icon: "🧩", title: "Break them into chunks", desc: "Split a prompt into the pieces you actually reuse — role, context, constraints, format." },
  { step: "04", icon: "✏️", title: "Compose and copy", desc: "Pick the chunks you need, preview the merged prompt, copy it in one click." },
];

/**
 * The wider Build Cadence product. None of this is released — Prompt Wallet is
 * the only thing in front of the public — so every entry stays explicitly
 * labelled as in development. Descriptions match what actually exists behind
 * the access gate; nothing here is aspirational beyond the ship date.
 */
const ROADMAP = [
  { icon: "🎯", title: "Goals and phases", desc: "Break an ambition into phases, tasks, and substeps until every step is small enough to start." },
  { icon: "📊", title: "Board", desc: "Move work across Not Started, In Progress, and Done — with your whole plan in one view." },
  { icon: "🔥", title: "Streaks", desc: "Daily momentum with Bronze, Silver, and Gold tiers. One task a day is the whole rule." },
  { icon: "🤖", title: "AI coach", desc: "An agent that drafts plans, breaks down goals, and keeps your board current as things change." },
  { icon: "👥", title: "Accountability", desc: "Follow friends, share progress, and cheer each other through the boring middle." },
  { icon: "🧩", title: "Templates", desc: "Fork a plan that already worked for someone else, or publish the one that worked for you." },
];

const FEATURES = [
  { icon: "💼", title: "Wallets", desc: "One per project or client. Reorder, duplicate, or restore anything you delete." },
  { icon: "🧩", title: "Reusable chunks", desc: "Write a piece once, recombine it across every prompt that needs it." },
  { icon: "✏️", title: "Compose drawer", desc: "Select chunks, see the merged result live, then copy the finished prompt." },
  { icon: "🔗", title: "Read-only sharing", desc: "Generate an unlisted link. Visitors can read it, or clone it into their own account." },
  { icon: "🔒", title: "Locks", desc: "Lock a chunk or a whole group so a prompt you rely on can't be edited by accident." },
  { icon: "↩️", title: "Undo anything", desc: "Deleted the wrong chunk? Restore it straight from the toast before it's gone." },
  { icon: "🌙", title: "Dark mode", desc: "Light, dark, or follow your system. Built for long sessions." },
  { icon: "📱", title: "Desktop and mobile", desc: "Three-pane layout on desktop, tabbed panes on your phone." },
];

export function LandingPage() {
  return (
    <div
      data-theme="light"
      style={{ colorScheme: "light" }}
      className="min-h-screen bg-white"
    >
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/brand-icon.png" alt="Prompt Wallet" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-lg font-bold text-brand-primary tracking-tight">Prompt Wallet</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 rounded">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
              Sign in
            </Link>
            <Link href="/sign-up" className="px-4 py-2 text-sm font-semibold bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors shadow-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light rounded-full text-brand-primary text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
          Public beta · Free — no credit card
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-950 tracking-tight leading-[1.05] mb-6">
          Your prompts,
          <br />
          <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-indigo-500 bg-clip-text text-transparent">
            actually organized
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop digging through chat history and scratch files. Keep every reusable prompt in a
          wallet, break it into chunks, and compose the one you need in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/sign-up" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/30">
            Start for free →
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            See how it works
          </a>
        </div>

        {/* Social proof strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <span>Unlimited wallets</span>
          <span className="text-gray-200">|</span>
          <span>Shareable read-only links</span>
          <span className="text-gray-200">|</span>
          <span>Works with any AI tool</span>
          <span className="text-gray-200">|</span>
          <span>Free forever</span>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="bg-gray-50 py-16 sm:py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Four steps from scattered prompts to a library you actually reuse</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-xs font-black text-brand-primary/40 tracking-widest mb-3">{s.step}</div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Everything in one place</h2>
          <p className="text-gray-500 max-w-xl mx-auto">A prompt library that keeps up with how you actually work</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-2 p-5 rounded-2xl border border-gray-100 hover:border-brand-primary/30 hover:bg-brand-light/20 transition-all cursor-default">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What we're building (roadmap — nothing here is released) ── */}
      <section className="bg-gray-50 py-16 sm:py-20 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              Coming soon
            </span>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Prompt Wallet is the first piece of Build Cadence
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Build Cadence is a workspace for turning intent into daily action — a place to plan
              real work, break it down until it&apos;s startable, and keep showing up. Prompt Wallet
              is the first module out of the door. Everything below is still in development.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ROADMAP.map((r) => (
              <div
                key={r.title}
                className="relative rounded-2xl border border-dashed border-gray-300 bg-white/60 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-3xl opacity-70">{r.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 whitespace-nowrap">
                    In development
                  </span>
                </div>
                <h3 className="font-semibold text-gray-700 mb-1">{r.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-10 max-w-2xl mx-auto">
            To be clear about what you get today:{" "}
            <span className="font-semibold text-gray-700">
              Prompt Wallet is the only part of Build Cadence that&apos;s publicly available
            </span>
            , and it&apos;s in beta. Signing up gets you the wallet — nothing above is included yet.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-dark rounded-3xl px-8 py-14 text-center text-white">
          {/* subtle grid overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to organize your prompts?</h2>
            <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
              Free forever for personal use. No credit card required.
            </p>
            <Link href="/sign-up" className="inline-block px-8 py-3.5 text-base font-semibold bg-white text-brand-primary rounded-xl hover:bg-gray-100 transition-all shadow-lg">
              Create your account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <img src="/brand-icon.png" alt="" className="w-5 h-5 rounded" />
            Prompt Wallet
            <span className="font-normal text-gray-400">by Build Cadence</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="hover:text-gray-700 transition-colors">Sign in</Link>
            <Link href="/sign-up" className="hover:text-gray-700 transition-colors">Sign up</Link>
          </div>
          <span>© 2026 Build Cadence</span>
        </div>
      </footer>
    </div>
  );
}
