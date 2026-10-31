import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useHCaptchaSubscribe } from '@lib/useHCaptchaSubscribe.ts';
import { submitSubscription } from '@lib/subscribe.ts';
import { InvisibleCaptcha } from '@components/core/InvisibleCaptcha.tsx';

// The real element loads hCaptcha's script from the network; tests stand in for it.
vi.mock('@hcaptcha/vanilla-hcaptcha', () => ({}));
vi.mock('@lib/subscribe.ts', () => ({ submitSubscription: vi.fn() }));
const mockSubmit = vi.mocked(submitSubscription);

function SubscribeForm() {
  const { status, captchaRef, handleSubmit } = useHCaptchaSubscribe();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e);
      }}
    >
      <input aria-label="email" defaultValue="ada@example.com" />
      <button type="submit">Subscribe</button>
      <InvisibleCaptcha ref={captchaRef} />
      <output>{status}</output>
    </form>
  );
}

function renderForm() {
  const { container } = render(<SubscribeForm />);
  const captcha = container.querySelector('h-captcha');
  if (!(captcha instanceof HTMLElement)) throw new Error('no <h-captcha> rendered');
  return captcha;
}

function verifiedEvent(token: string) {
  return Object.assign(new Event('verified'), { token });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
}

beforeEach(() => {
  mockSubmit.mockReset();
});

describe('useHCaptchaSubscribe', () => {
  it('renders the captcha as an <h-captcha> with the site key, so the library upgrades it', () => {
    const captcha = renderForm();
    expect(captcha).toHaveAttribute('site-key');
    expect(captcha).toHaveAttribute('size', 'invisible');
  });

  it('given the captcha passes, submits its token and shows success', async () => {
    // given
    mockSubmit.mockResolvedValue();
    const captcha = renderForm();
    Object.assign(captcha, {
      execute: () => captcha.dispatchEvent(verifiedEvent('token-123')),
    });
    // when
    submit();
    // then
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('success');
    });
    expect(mockSubmit).toHaveBeenCalledWith('ada@example.com', 'token-123');
  });

  it('given the endpoint rejects the signup, shows an error', async () => {
    // given
    mockSubmit.mockRejectedValue(new Error('Subscribe rejected: captcha'));
    const captcha = renderForm();
    Object.assign(captcha, { execute: () => captcha.dispatchEvent(verifiedEvent('bad')) });
    // when
    submit();
    // then
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('error');
    });
  });

  it('given the captcha element never upgraded, shows an error instead of hanging', () => {
    renderForm();
    submit();
    expect(screen.getByRole('status')).toHaveTextContent('error');
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('given execute throws because the hCaptcha API is not ready, shows an error', () => {
    // given
    const captcha = renderForm();
    Object.assign(captcha, {
      execute: () => {
        throw new Error('hCaptcha API not loaded');
      },
    });
    // when
    submit();
    // then
    expect(screen.getByRole('status')).toHaveTextContent('error');
  });
});
