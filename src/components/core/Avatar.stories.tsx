import { Avatar } from './Avatar.tsx';

export default { title: 'Core / Avatar' };

export const Initials = () => <Avatar initials="CA" />;
export const Sizes = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Avatar initials="CA" size={32} />
    <Avatar initials="CA" size={48} />
    <Avatar initials="CA" size={64} />
  </div>
);
