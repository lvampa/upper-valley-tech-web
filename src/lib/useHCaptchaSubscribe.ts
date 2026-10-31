import { useState, useEffect, useRef, type SyntheticEvent } from 'react';
import { type Status } from './types.ts';
import { submitSubscription } from './subscribe.ts';

// Load the vanilla-hcaptcha custom element once, on first use.
if (typeof window !== 'undefined') {
  void import('@hcaptcha/vanilla-hcaptcha').catch(() => {
    // Element failed to load. handleSubmit reports an error, since the endpoint needs a token.
  });
}

// vanilla-hcaptcha upgrades <h-captcha> elements with an execute() method.
interface CaptchaElement extends HTMLElement {
  execute(): void;
}
// Narrow to it via a type guard (no cast) so we never assume it's present.
function isCaptcha(el: HTMLElement): el is CaptchaElement {
  return 'execute' in el && typeof el.execute === 'function';
}
function runCaptcha(el: HTMLElement | null): boolean {
  if (!el || !isCaptcha(el)) return false;
  try {
    // Throws if the hCaptcha API script hasn't loaded or rendered yet.
    el.execute();
    return true;
  } catch {
    return false;
  }
}

// vanilla-hcaptcha copies the token onto the `verified` Event itself as `token`.
function readToken(e: Event): string {
  return 'token' in e && typeof e.token === 'string' ? e.token : '';
}

/**
 * Drives the invisible-hCaptcha + Apps Script subscribe flow.
 * Returns the current status, a ref to attach to the captcha <div>, and a
 * form submit handler. On submit: validate → run captcha → POST on verify.
 */
export function useHCaptchaSubscribe() {
  const [status, setStatus] = useState<Status>('idle');
  const captchaRef = useRef<HTMLElement | null>(null);
  const emailRef = useRef('');

  useEffect(() => {
    const el = captchaRef.current;
    if (!el) return;

    const onVerified = (e: Event) => {
      submitSubscription(emailRef.current, readToken(e))
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
    setStatus(runCaptcha(captchaRef.current) ? 'loading' : 'error');
  };

  return { status, captchaRef, handleSubmit };
}
