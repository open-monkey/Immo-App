import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button {...props} className={`button button-${variant} ${className}`}>
      {children}
    </button>
  );
}
