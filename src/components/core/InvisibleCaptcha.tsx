import { type Ref } from 'react';
import { CAPTCHA_KEY } from '@lib/constants.ts';

export function InvisibleCaptcha({ ref }: { ref: Ref<HTMLElement> }) {
  return <h-captcha ref={ref} site-key={CAPTCHA_KEY} size="invisible" />;
}
