// App-wide configuration constants.

export const CONTACT_EMAIL = 'uppervalleytechnology@gmail.com';

// hCaptcha won't run on localhost with a real key, so dev uses its public test key.
const HCAPTCHA_TEST_KEY = '10000000-ffff-ffff-ffff-000000000001';
export const CAPTCHA_KEY = import.meta.env.DEV
  ? HCAPTCHA_TEST_KEY
  : '25ba8b1c-6b18-4e16-aa18-d558d1c85032';
