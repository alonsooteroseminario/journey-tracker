import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-lg border border-border p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Page Not Found
        </h2>
        <p className="text-text-secondary mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
