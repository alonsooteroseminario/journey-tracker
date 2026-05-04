"use client";

import { useState } from "react";

interface MergedPreviewProps {
  text: string;
  onCopy: () => void;
}

export function MergedPreview({ text, onCopy }: MergedPreviewProps) {
  const [copied, setCopied] = useState(false);
  const isEmpty = text.length === 0;
  const tokenCount = Math.ceil(text.length / 4);

  const handleCopy = async () => {
    if (isEmpty) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        readOnly
        value={text}
        rows={12}
        placeholder="Compose chunks above to preview the merged prompt…"
        className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-md bg-gray-50 resize-y focus:outline-none"
        aria-label="Merged prompt preview"
      />
      {!isEmpty && (
        <p className="text-xs text-gray-400" aria-label="Token count">
          ≈ {tokenCount} tokens
        </p>
      )}
      <button
        onClick={handleCopy}
        disabled={isEmpty}
        className={`flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isEmpty
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : copied
            ? "bg-green-500 text-white"
            : "bg-brand-primary text-white hover:bg-brand-secondary"
        }`}
        aria-label={copied ? "Copied!" : "Copy merged prompt"}
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Merged
          </>
        )}
      </button>
    </div>
  );
}
