import { Logo } from './Logo.tsx';

export default { title: 'Brand / Logo' };

export const Small = () => <Logo size="sm" />;
export const Medium = () => <Logo size="md" />;
export const XL = () => <Logo size="xl" />;
export const MarkOnly = () => <Logo size="md" wordmark={false} />;
