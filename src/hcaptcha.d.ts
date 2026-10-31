import { type DetailedHTMLProps, type HTMLAttributes } from 'react';

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
