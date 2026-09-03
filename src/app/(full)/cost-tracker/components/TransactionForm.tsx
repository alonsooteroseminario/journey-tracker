"use client";

import { useState } from "react";

interface TransactionFormProps {
  onSubmit: (data: { amount: number; category: string; description?: string; date?: string }) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES = [
  { value: "claude", label: "Claude API", icon: "🤖" },
  { value: "elevenlabs", label: "ElevenLabs TTS", icon: "🔊" },
  { value: "vercel", label: "Vercel Hosting", icon: "▲" },
  { value: "railway", label: "Railway Hosting", icon: "🚂" },
  { value: "github", label: "GitHub", icon: "🐙" },
  { value: "mongodb", label: "MongoDB Atlas", icon: "🍃" },
  { value: "cloudflare", label: "Cloudflare", icon: "☁️" },
  { value: "discord", label: "Discord Turbo", icon: "💬" },
  { value: "cursor", label: "Cursor Editor", icon: "⌨️" },
  { value: "other", label: "Other", icon: "📦" },
];

export function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    amount: "",
    category: "claude",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCursor = formData.category === "cursor";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || undefined,
        date: formData.date,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isCursor && (
        <div className="bg-brand-light border border-brand-primary/20 rounded-lg p-3 text-sm text-brand-primary">
          💡 Cursor Pro is $20/month — enter a fixed monthly subscription amount.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Amount (CAD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-text-muted">$</span>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            className="w-full pl-7 pr-4 py-2 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Description (optional)
        </label>
        <textarea
          name="description"
          placeholder="Add notes about this transaction..."
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Date
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all"
        >
          {isSubmitting ? "Adding..." : "Add Transaction"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-surface-hover text-text-secondary rounded-lg hover:bg-surface-hover font-medium transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
