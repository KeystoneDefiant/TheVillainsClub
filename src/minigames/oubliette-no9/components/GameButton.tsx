import { ClubButton, ClubButtonProps } from '@/components/ui/ClubButton';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface GameButtonProps extends Omit<ClubButtonProps, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantMap: Record<ButtonVariant, "filled" | "light" | "outline"> = {
  primary: 'filled',
  secondary: 'light',
  ghost: 'outline',
  danger: 'filled',
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
    <ClubButton
      fancy
      variant={variantMap[variant]}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      className={`${className} oubliette-action-button`}
      {...props}
    >
      {children}
    </ClubButton>
  );
}
