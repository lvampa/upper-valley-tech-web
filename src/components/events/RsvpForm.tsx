import { EmailCapture } from '@components/core/EmailCapture.tsx';
import { InvisibleCaptcha } from '@components/core/InvisibleCaptcha.tsx';
import { rsvpPath } from '@lib/signup.ts';
import { useHCaptchaSignup } from '@lib/useHCaptchaSignup.ts';

export function RsvpForm({ eventId }: { eventId: string }) {
  const { status, captchaRef, handleSubmit } = useHCaptchaSignup(rsvpPath(eventId));
  return (
    <>
      <EmailCapture
        status={status}
        onSubmit={handleSubmit}
        buttonLabel="RSVP"
        loadingLabel="Saving…"
        successMessage="You're on the list."
        maxWidth="none"
      />
      <InvisibleCaptcha ref={captchaRef} />
    </>
  );
}
