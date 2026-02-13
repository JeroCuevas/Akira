interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'info' | 'warning';
  className?: string;
}

export function Alert({ children, variant = 'info', className = '' }: AlertProps) {
  const variantStyles = {
    success: 'bg-brutal-lime',
    error: 'bg-red-300',
    info: 'bg-brutal-cyan',
    warning: 'bg-brutal-yellow',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'i',
    warning: '!',
  };

  return (
    <div
      className={`
        border-2 border-black
        shadow-brutal-sm
        px-4 py-3
        font-brutal
        flex items-start gap-3
        ${variantStyles[variant]}
        ${className}
      `}
      role="alert"
    >
      <span className="font-bold text-lg flex-shrink-0">
        {iconMap[variant]}
      </span>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
