interface BadgeProps {
  children: React.ReactNode;
  variant?: 'processing' | 'ready' | 'error' | 'pending' | 'generating' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'pending', className = '' }: BadgeProps) {
  const variantStyles = {
    processing: 'bg-brutal-yellow',
    ready: 'bg-brutal-lime',
    error: 'bg-red-400',
    pending: 'bg-gray-200',
    generating: 'bg-brutal-cyan',
    info: 'bg-brutal-cyan',
  };

  return (
    <span
      className={`
        inline-block
        px-2 py-1
        border-2 border-black
        text-xs
        font-bold
        font-brutal
        uppercase
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
