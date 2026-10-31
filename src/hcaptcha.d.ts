import { type DetailedHTMLProps, type HTMLAttributes } from 'react';

// The <h-captcha> custom element from @hcaptcha/vanilla-hcaptcha.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'h-captcha': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        'site-key': string;
        size?: 'normal' | 'compact' | 'invisible';
      };
    }
  }
}
