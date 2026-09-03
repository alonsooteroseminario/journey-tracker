"use client";

import Link from "next/link";

const RECENT_UPDATES = [
  {
    icon: "💼",
    label: "NEW",
    title: "Prompts Wallet",
    desc: "Organise reusable AI prompts into groups and chunks. Compose multi-part prompts and share wallets via a public link.",
    color: "from-brand-primary/10 to-brand-secondary/10 border-brand-primary/20",
    badge: "bg-brand-primary/10 text-brand-primary",
  },
  {
    icon: "🔑",
    label: "NEW",
    title: "Bring Your Own Key",
    desc: "Connect your Anthropic API key in Settings. The AI agent uses your key — your data, your cost. Track token usage in real time.",
    color: "from-amber-50 to-orange-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    icon: "🌙",
    label: "NEW",
    title: "Dark Mode",
    desc: "Smooth dark/light/system theme toggle across every page. Soft warm-slate palette — easy on the eyes all day.",
    color: "from-slate-50 to-indigo-50 border-slate-200",
    badge: "bg-slate-200 text-slate-700",
  },
  {
    icon: "🔗",
    label: "NEW",
    title: "Wallet Sharing",
    desc: "Generate an unlisted link to share any Prompts Wallet publicly. Visitors can view and clone it to their own account.",
    color: "from-green-50 to-teal-50 border-green-200",
    badge: "bg-green-100 text-green-700",
  },
  {
    icon: "⚡",
    label: "NEW",
    title: "MCP REST API",
    desc: "Every tool and skill exposed as a REST endpoint. Automate your goals, tasks, and streaks from any external system.",
    color: "from-violet-50 to-purple-50 border-violet-200",
    badge: "bg-violet-100 text-violet-700",
  },
];

const FEATURES = [
  { icon: "🎯", title: "Goal Hierarchy", desc: "Goals → Phases → Tasks → Substeps. Infinite depth, zero clutter." },
  { icon: "📊", title: "Kanban Board", desc: "Drag-and-drop tasks across Not Started / In Progress / Done columns." },
  { icon: "🔥", title: "Daily Streaks", desc: "Bronze, Silver, Gold tiers. Complete one task daily to keep your momentum." },
  { icon: "🤖", title: "AI Assistant", desc: "Built-in agent with 34 tools. Ask it to create goals, analyse progress, or manage tasks." },
  { icon: "📈", title: "Analytics", desc: "Velocity trends, completion forecasts, and per-goal streak dashboards." },
  { icon: "👥", title: "Social Feed", desc: "Follow friends, cheer each other on, and stay accountable together." },
  { icon: "🎨", title: "Template Marketplace", desc: "Fork community-built goal templates. Ship yours for others to use." },
  { icon: "💼", title: "Prompts Wallet", desc: "Curate, compose, and share reusable prompt libraries for your AI workflows." },
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
            <img src="/brand-icon.png" alt="Cadence" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-lg font-bold text-brand-primary tracking-tight">Cadence</span>
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
          5 major features just shipped
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-950 tracking-tight leading-[1.05] mb-6">
          Turn big goals into
          <br />
          <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-indigo-500 bg-clip-text text-transparent">
            daily momentum
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Break goals into tasks, track streaks, get AI coaching, and share your journey — all in one clean workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/sign-up" className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-brand-primary text-white rounded-xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/30">
            Start for free →
          </Link>
          <Link href="/marketplace" className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            Browse goal templates
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-1.5"><span className="text-yellow-400">★★★★★</span> Goal tracking</span>
          <span className="text-gray-200">|</span>
          <span>34 AI tools built-in</span>
          <span className="text-gray-200">|</span>
          <span>Bronze → Gold streak tiers</span>
          <span className="text-gray-200">|</span>
          <span>Free to start</span>
        </div>
      </section>

      {/* ── What's New ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-3">
            🚀 Latest updates
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Just shipped</h2>
          <p className="text-gray-500 mt-2">Five big features landed this sprint</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECENT_UPDATES.map((u) => (
            <div key={u.title} className={`rounded-2xl border p-5 bg-gradient-to-br ${u.color}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{u.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.badge}`}>{u.label}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{u.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">A proven 4-step workflow to turn any ambition into achievable daily actions</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", icon: "🎯", title: "Set your goal", desc: "Define what you want to achieve — learn a skill, ship a product, build a habit." },
              { step: "02", icon: "✂️", title: "Break it down", desc: "Split into phases, tasks, and substeps. Every action becomes bite-sized." },
              { step: "03", icon: "📊", title: "Track progress", desc: "Kanban board, analytics charts, and completion forecasts keep you honest." },
              { step: "04", icon: "🔥", title: "Build momentum", desc: "Daily streaks compound. One task a day keeps the plateau away." },
            ].map((s) => (
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

      {/* ── Free Prompt Wallet Tier ── */}
      <section className="py-16 px-6 bg-brand-light/40">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wide uppercase bg-brand-primary text-white rounded-full">
            Free
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Prompt Wallet — free for everyone
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Keep your prompts organized in wallets, group them into reusable blocks,
            and compose them into a finished prompt in seconds. No credit card, no trial.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10 text-left">
            {[
              { icon: "💼", title: "Wallets", body: "One wallet per project or client. Reorder, duplicate, archive." },
              { icon: "🧩", title: "Reusable blocks", body: "Break prompts into chunks and recombine them however you need." },
              { icon: "🔗", title: "Shareable", body: "Share a read-only link to any wallet with a single click." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-5 shadow-sm">
                <div className="text-2xl mb-2">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
          <Link
            href="/sign-up"
            className="inline-block px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg font-medium hover:opacity-90 transition-all"
          >
            Start free with Prompt Wallet
          </Link>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Everything in one place</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Every tool you need to plan, execute, and celebrate your goals</p>
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

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 pb-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-dark rounded-3xl px-8 py-14 text-center text-white">
          {/* subtle grid overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to start your journey?</h2>
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
            Cadence
          </div>
          <div className="flex items-center gap-6">
            <Link href="/marketplace" className="hover:text-gray-700 transition-colors">Templates</Link>
            <Link href="/sign-in" className="hover:text-gray-700 transition-colors">Sign in</Link>
            <Link href="/sign-up" className="hover:text-gray-700 transition-colors">Sign up</Link>
          </div>
          <span>© 2026 Cadence</span>
        </div>
      </footer>
    </div>
  );
}
