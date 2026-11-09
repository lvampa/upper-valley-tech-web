import { useState, useEffect, useRef, type SyntheticEvent } from 'react';
import { type Status } from './types.ts';
import { submitSignup, type SignupPath } from './signup.ts';

// Load the vanilla-hcaptcha custom element once, on first use.
if (typeof window !== 'undefined') {
  void import('@hcaptcha/vanilla-hcaptcha').catch(() => {
    // handleSubmit reports an error if this fails.
  });
}

interface CaptchaElement extends HTMLElement {
  execute(): void;
}
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

// The token is a property on the Event itself, not on `detail`.
function readToken(e: Event): string {
  return 'token' in e && typeof e.token === 'string' ? e.token : '';
}

/**
 * Drives the invisible-hCaptcha + events API signup flow for one endpoint.
 * Returns the current status, a ref for <InvisibleCaptcha>, and a
 * form submit handler. On submit: validate → run captcha → POST on verify.
 */
export function useHCaptchaSignup(path: SignupPath) {
  const [status, setStatus] = useState<Status>('idle');
  const captchaRef = useRef<HTMLElement | null>(null);
  const emailRef = useRef('');

  useEffect(() => {
    const el = captchaRef.current;
    if (!el) return;

    const onVerified = (e: Event) => {
      submitSignup(path, emailRef.current, readToken(e))
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
  }, [path]);

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
