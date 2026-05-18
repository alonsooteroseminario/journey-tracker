interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 'w-7 h-7', text: 'text-base' },
  md: { icon: 'w-9 h-9', text: 'text-xl' },
  lg: { icon: 'w-14 h-14', text: 'text-3xl' },
};

export function BrandLogo({ size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const s = sizes[size];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/brand-icon.png"
        alt="Cadence"
        className={`${s.icon} rounded-xl object-contain`}
      />
      {showText && (
        <span className={`${s.text} font-bold text-brand-primary`}>
          Cadence
        </span>
      )}
    </div>
  );
}
