import { useState, type CSSProperties, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'nav' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonStatus = 'idle' | 'loading' | 'success' | 'error';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  icon?: ReactNode;
  status?: ButtonStatus;
  loadingLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  style?: CSSProperties;
  children?: ReactNode;
  target?: string;
  rel?: string;
  'aria-busy'?: boolean;
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ animation: 'uvt-spin 0.7s linear infinite' }}
    >
      <style>{'@keyframes uvt-spin{to{transform:rotate(360deg)}}'}</style>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 8v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  icon,
  status = 'idle',
  loadingLabel,
  disabled = false,
  onClick,
  type = 'button',
  style,
  children,
  target,
  rel,
}: ButtonProps) {
  const [hover, setHover] = useState(false);

  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13 },
    md: { padding: '10px 18px', fontSize: 14 },
    lg: { padding: '14px 22px', fontSize: 15 },
  };

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isBusy = isLoading || disabled;

  const base: CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontWeight: variant === 'primary' || variant === 'text' ? 600 : 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: variant === 'text' ? 4 : 6,
    cursor: isBusy ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    border: 0,
    lineHeight: 1.1,
    transition:
      'transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), background var(--dur-base) var(--ease)',
    opacity: disabled ? 0.45 : 1,
    ...sizes[size],
  };

  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: {
      borderRadius: 'var(--r-sm)',
      background: 'var(--grad-btn)',
      color: 'var(--on-accent)',
      boxShadow: hover && !isBusy ? 'var(--shadow-btn-hover)' : 'var(--shadow-btn)',
      transform: hover && !isBusy ? 'translateY(-1px)' : 'none',
    },
    ghost: {
      borderRadius: 'var(--r-sm)',
      background: hover && !isBusy ? 'rgba(244,241,236,0.06)' : 'transparent',
      color: 'var(--ink)',
      border: '1px solid var(--line-2)',
    },
    nav: {
      borderRadius: 'var(--r-sm)',
      background: hover && !isBusy ? 'rgba(244,241,236,0.14)' : 'rgba(244,241,236,0.08)',
      color: 'var(--ink)',
      border: '1px solid var(--line-2)',
      fontSize: 13,
      padding: '8px 14px',
    },
    text: {
      background: 'transparent',
      color: 'var(--coral)',
      padding: '0',
      textDecoration: hover && !isBusy ? 'underline' : 'none',
      textUnderlineOffset: 3,
    },
  };

  const statusStyle: CSSProperties | null = isSuccess
    ? {
        background: 'var(--success)',
        backgroundImage: 'none',
        color: 'var(--on-success)',
        boxShadow: 'none',
        transform: 'none',
        border: '0',
      }
    : isError
      ? {
          background: 'var(--surface-error)',
          backgroundImage: 'none',
          color: 'var(--error)',
          boxShadow: 'none',
          transform: 'none',
          border: '1px solid var(--border-error)',
        }
      : null;

  const leadIcon = isLoading ? (
    <Spinner />
  ) : isSuccess ? (
    <CheckIcon />
  ) : isError ? (
    <AlertIcon />
  ) : null;
  const label = isLoading ? (loadingLabel ?? children) : children;

  const sharedProps = {
    'aria-busy': isLoading || undefined,
    onMouseEnter: () => {
      setHover(true);
    },
    onMouseLeave: () => {
      setHover(false);
    },
    style: { ...base, ...variants[variant], ...statusStyle, ...style },
  };

  if (href) {
    return (
      <a href={isBusy ? undefined : href} target={target} rel={rel} {...sharedProps}>
        {leadIcon}
        {label}
        {icon && !isLoading && !isSuccess && !isError ? (
          <span style={{ display: 'inline-flex' }}>{icon}</span>
        ) : null}
      </a>
    );
  }

  return (
    <button type={type} disabled={isBusy} onClick={isBusy ? undefined : onClick} {...sharedProps}>
      {leadIcon}
      {label}
      {icon && !isLoading && !isSuccess && !isError ? (
        <span style={{ display: 'inline-flex' }}>{icon}</span>
      ) : null}
    </button>
  );
}
