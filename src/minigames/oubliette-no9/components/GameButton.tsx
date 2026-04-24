import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-game btn-game-primary',
  secondary: 'btn-game btn-game-secondary',
  ghost: 'btn-game btn-game-ghost',
  danger: 'btn-game btn-game-primary',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'py-2 px-4 text-sm rounded-md',
  md: 'py-3 px-6 text-base rounded-lg',
  lg: 'py-4 px-8 text-lg rounded-xl',
};

export function GameButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: GameButtonProps) {
  return (
    <button
      type="button"
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
