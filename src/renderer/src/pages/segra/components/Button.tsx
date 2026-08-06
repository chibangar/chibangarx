import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'nav' | 'menu' | 'menuPrimary' | 'menuDanger' | 'menuPurple' | 'danger' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: boolean;
  loading?: boolean;
  loadingIcon?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-chibangarx-card border border-chibangarx-border hover:border-chibangarx-primary hover:text-chibangarx-primary text-chibangarx-text-secondary',
  ghost: 'bg-transparent text-chibangarx-text-secondary hover:bg-chibangarx-border-secondary',
  nav: 'bg-chibangarx-card border border-chibangarx-border hover:border-chibangarx-primary hover:text-chibangarx-primary text-chibangarx-text-secondary w-full justify-start py-3',
  menu: 'w-full flex items-center gap-2 px-4 py-3 text-chibangarx-text rounded-lg hover:bg-chibangarx-border-secondary transition-all',
  menuPrimary: 'w-full flex items-center gap-2 px-4 py-3 text-chibangarx-primary rounded-lg hover:bg-chibangarx-primary/10 transition-all',
  menuDanger: 'w-full flex items-center gap-2 px-4 py-3 text-red-400 rounded-lg hover:bg-red-500/10 transition-all',
  menuPurple: 'w-full flex items-center gap-2 px-4 py-3 text-purple-400 rounded-lg hover:bg-purple-500/10 transition-all',
  danger: 'bg-red-500/20 hover:bg-red-500/10 text-red-400 border border-red-500/30',
  success: 'bg-green-500/20 hover:bg-green-500/10 text-green-400 border border-green-500/30',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon = false, loading = false, loadingIcon, disabled = false, className = '', children, ...props }, ref) => {
    const isMenuVariant = variant.startsWith('menu');
    const baseStyles = variantStyles[variant];
    const sizeStyle = isMenuVariant ? '' : sizeStyles[size];
    const iconStyle = icon && !isMenuVariant ? 'rounded-full' : 'rounded-lg';
    const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';
    const combinedClassName = [baseStyles, sizeStyle, iconStyle, disabledStyle, 'flex items-center gap-2 transition-colors', className].filter(Boolean).join(' ');

    return (
      <button ref={ref} className={combinedClassName} disabled={disabled || loading} {...props}>
        {loading && (loadingIcon ?? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />)}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
