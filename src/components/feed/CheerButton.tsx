"use client";

interface CheerButtonProps {
  cheerCount: number;
  hasCheered: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function CheerButton({
  cheerCount,
  hasCheered,
  onToggle,
  disabled = false,
}: CheerButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200
        ${
          hasCheered
            ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
            : "bg-surface-hover text-text-secondary border-2 border-transparent hover:border-orange-200"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
      `}
    >
      <span className={`text-base ${hasCheered ? "animate-bounce" : ""}`}>
        🎉
      </span>
      <span>{cheerCount}</span>
    </button>
  );
}
