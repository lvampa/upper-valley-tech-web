import { useState, type CSSProperties, type SyntheticEvent } from 'react';
import { Button } from './Button.tsx';
import { type Status } from '@lib/types.ts';

interface EmailCaptureProps {
  placeholder?: string;
  buttonLabel?: string;
  type?: string;
  note?: string;
  noteAlign?: 'left' | 'center' | 'right';
  status?: Status;
  loadingLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  retryLabel?: string;
  onSubmit?: (e: SyntheticEvent<HTMLFormElement>) => void;
  maxWidth?: number | string;
}

function SuccessTick() {
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'var(--success)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 13l4 4L19 7"
          stroke="var(--on-success)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function EmailCapture({
  placeholder = 'you@domain.com',
  buttonLabel = 'Subscribe',
  type = 'email',
  note,
  noteAlign = 'left',
  status = 'idle',
  loadingLabel = 'Subscribing…',
  successMessage = "You're on the list. See you at the next one.",
  errorMessage = 'Something went wrong — please try again.',
  retryLabel = 'Try again',
  onSubmit,
  maxWidth = 380,
}: EmailCaptureProps) {
  const [focus, setFocus] = useState(false);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const borderColor = isError ? 'var(--border-error)' : focus ? 'var(--coral)' : 'var(--line-2)';

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    gap: 8,
    background: isError ? 'var(--surface-error)' : focus ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.32)',
    border: `1px solid ${borderColor}`,
    borderRadius: 'var(--r-md)',
    padding: 6,
    width: '100%',
    transition: 'border-color var(--dur-base) var(--ease), background var(--dur-base) var(--ease)',
  };

  return (
    <div style={{ width: '100%', maxWidth }}>
      {isSuccess ? (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--surface-success)',
            border: '1px solid var(--border-success)',
            borderRadius: 'var(--r-md)',
            padding: '12px 14px',
            color: 'var(--ink)',
            fontSize: 14,
          }}
        >
          <SuccessTick />
          <span>{successMessage}</span>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(e);
          }}
          style={containerStyle}
        >
          <input
            type={type}
            placeholder={placeholder}
            aria-label="Email address"
            aria-invalid={isError || undefined}
            disabled={isLoading}
            className="uvt-input"
            onFocus={() => {
              setFocus(true);
            }}
            onBlur={() => {
              setFocus(false);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              outline: 0,
              color: 'var(--ink)',
              fontSize: 15,
              padding: '10px 12px',
              fontFamily: 'var(--font-body)',
              minWidth: 0,
              opacity: isLoading ? 0.6 : 1,
            }}
          />
          <Button
            variant="primary"
            type="submit"
            status={isLoading ? 'loading' : 'idle'}
            loadingLabel={loadingLabel}
          >
            {isError ? retryLabel : buttonLabel}
          </Button>
        </form>
      )}
      {(isError || note) && !isSuccess ? (
        <p
          role={isError ? 'alert' : undefined}
          style={{
            margin: '10px 0 0',
            fontSize: 12,
            lineHeight: 1.5,
            color: isError ? 'var(--error)' : 'var(--ink-3)',
            textAlign: noteAlign,
          }}
        >
          {isError ? errorMessage : note}
        </p>
      ) : null}
    </div>
  );
}
