"use client";

import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-light/30 to-indigo-50/60">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/brand-icon.png" alt="Journey Tracker" className="w-8 h-8 rounded-xl object-contain" />
            <span className="text-xl font-bold text-brand-primary">
              Journey Tracker
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:opacity-90 transition-all shadow-md shadow-brand-primary/25"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
          Turn Big Dreams into
          <br />
          <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
            Daily Wins
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Break down your goals into manageable tasks, track your progress with analytics, and build unstoppable streaks. Your journey to success starts here.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto px-8 py-4 text-lg font-medium bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-brand-primary/25"
          >
            Get Started Free
          </Link>
          <Link
            href="/marketplace"
            className="w-full sm:w-auto px-8 py-4 text-lg font-medium bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-md border border-gray-200"
          >
            Browse Templates
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
          How It Works
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Our proven 4-step workflow helps you achieve more by breaking goals into actionable daily tasks
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-sm font-bold text-brand-primary mb-2">STEP 1</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Set Your Goal</h3>
            <p className="text-gray-600">
              Define what you want to achieve. Whether it&apos;s learning a skill, completing a project, or building a habit.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">✂️</span>
            </div>
            <div className="text-sm font-bold text-brand-secondary mb-2">STEP 2</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Break It Down</h3>
            <p className="text-gray-600">
              Split your goal into phases, tasks, and substeps. Make every action bite-sized and achievable.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-sm font-bold text-brand-accent mb-2">STEP 3</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Track Progress</h3>
            <p className="text-gray-600">
              Visualize your journey with analytics, charts, and completion projections. See how far you&apos;ve come.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="text-sm font-bold text-green-600 mb-2">STEP 4</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Achieve More</h3>
            <p className="text-gray-600">
              Build daily streaks by completing at least one task daily. Turn consistency into unstoppable momentum.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 bg-white/50 rounded-3xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
          Everything You Need to Succeed
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Powerful features designed to keep you motivated and on track
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-start">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Multi-Level Organization</h3>
            <p className="text-gray-600">
              Organize work into goals, phases, tasks, and substeps. Perfect for complex projects or simple to-dos.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-start">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics</h3>
            <p className="text-gray-600">
              Track completion rates, velocity, and get AI-powered projections for when you&apos;ll finish.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-start">
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Streak Tracking</h3>
            <p className="text-gray-600">
              Stay consistent with daily streaks. Complete one task daily to keep your momentum going.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-start">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Activity Calendar</h3>
            <p className="text-gray-600">
              Visualize your progress over time with a beautiful calendar showing all your completed tasks.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="flex flex-col items-start">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-gray-600">
              Get help breaking down goals, managing tasks, and staying on track with your built-in AI coach.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="flex flex-col items-start">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Template Marketplace</h3>
            <p className="text-gray-600">
              Jump-start your goals with pre-built templates from the community. Or create your own to share.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="bg-gradient-to-r from-brand-primary to-brand-dark rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg sm:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of achievers who are turning their dreams into reality, one task at a time.
          </p>
          <Link
            href="/sign-up"
            className="inline-block px-8 py-4 text-lg font-medium bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span className="font-bold text-gray-900">Journey Tracker</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2026 Journey Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
