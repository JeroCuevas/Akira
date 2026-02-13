interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  onClick,
}: ButtonProps) {
  const baseStyles = 'font-bold font-brutal transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-brutal-yellow border-2 border-black shadow-brutal hover:shadow-brutal-sm active:shadow-none',
    secondary: 'bg-white border-2 border-black shadow-brutal hover:shadow-brutal-sm active:shadow-none',
    danger: 'bg-red-400 border-2 border-black shadow-brutal hover:shadow-brutal-sm active:shadow-none',
    ghost: 'bg-transparent hover:bg-gray-100',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const hoverStyles = variant !== 'ghost'
    ? 'hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px]'
    : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${hoverStyles} ${className}`}
    >
      {children}
    </button>
  );
}
