import { useState, useEffect, useRef, type SyntheticEvent } from 'react';
import { type Status } from './types.ts';
import { FORM_URL, EMAIL_FIELD } from './constants.ts';

// Load the vanilla-hcaptcha custom element once, on first use.
if (typeof window !== 'undefined') {
  void import('@hcaptcha/vanilla-hcaptcha').catch(() => {
    // Element failed to load — the form still submits, just unverified.
  });
}

// vanilla-hcaptcha upgrades the <div> it's attached to with an execute() method.
interface CaptchaElement extends HTMLElement {
  execute(): void;
}
// Narrow to it via a type guard (no cast) so we never assume it's present.
function isCaptcha(el: HTMLElement): el is CaptchaElement {
  return 'execute' in el && typeof el.execute === 'function';
}
function runCaptcha(el: HTMLElement | null): void {
  if (el && isCaptcha(el)) el.execute();
}

// Pull the token off the `verified` CustomEvent without asserting its shape.
function readToken(e: Event): string {
  if (
    'detail' in e &&
    typeof e.detail === 'object' &&
    e.detail !== null &&
    'response' in e.detail &&
    typeof e.detail.response === 'string'
  ) {
    return e.detail.response;
  }
  return '';
}

/**
 * Drives the invisible-hCaptcha + Google Form subscribe flow.
 * Returns the current status, a ref to attach to the captcha <div>, and a
 * form submit handler. On submit: validate → run captcha → POST on verify.
 */
export function useHCaptchaSubscribe() {
  const [status, setStatus] = useState<Status>('idle');
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef('');

  useEffect(() => {
    const el = captchaRef.current;
    if (!el) return;

    const onVerified = (e: Event) => {
      const fd = new FormData();
      fd.append(EMAIL_FIELD, emailRef.current);
      fd.append('h-captcha-response', readToken(e));
      fetch(FORM_URL, { method: 'POST', body: fd, mode: 'no-cors' })
        .then(() => {
          setStatus('success');
        })
        .catch(() => {
          setStatus('error');
        });
    };
    const onError = () => {
      setStatus('error');
    };

    el.addEventListener('verified', onVerified);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('verified', onVerified);
      el.removeEventListener('error', onError);
    };
  }, []);

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    const email = e.currentTarget.querySelector<HTMLInputElement>('input')?.value.trim() ?? '';
    if (!/.+@.+\..+/.test(email)) {
      setStatus('error');
      return;
    }
    emailRef.current = email;
    setStatus('loading');
    runCaptcha(captchaRef.current);
  };

  return { status, captchaRef, handleSubmit };
}
