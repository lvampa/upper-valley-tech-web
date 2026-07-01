import { EmailCapture } from './EmailCapture.tsx';

export default { title: 'Core / EmailCapture' };

export const Idle = () => <EmailCapture />;
export const Loading = () => <EmailCapture status="loading" />;
export const Success = () => <EmailCapture status="success" />;
export const Error = () => <EmailCapture status="error" />;
export const WithNote = () => (
  <EmailCapture
    note="One email per meetup. No spam, no sponsors in your inbox."
    noteAlign="center"
  />
);
