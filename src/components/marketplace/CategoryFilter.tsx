"use client";

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

const categories = [
  { value: "all", label: "All", emoji: "🌟" },
  { value: "Career", label: "Career", emoji: "💼" },
  { value: "Health", label: "Health", emoji: "🏃" },
  { value: "Education", label: "Education", emoji: "📚" },
  { value: "Immigration", label: "Immigration", emoji: "✈️" },
  { value: "Finance", label: "Finance", emoji: "💰" },
  { value: "Other", label: "Other", emoji: "📌" },
];

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onChange(category.value)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full font-medium transition-all ${
            selected === category.value
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-surface-hover text-text-secondary hover:bg-surface-hover"
          }`}
        >
          <span className="mr-1">{category.emoji}</span>
          {category.label}
        </button>
      ))}
    </div>
  );
}
