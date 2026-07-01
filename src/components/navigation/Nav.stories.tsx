import { Nav } from './Nav.tsx';

export default { title: 'Navigation / Nav' };

export const Default = () => <Nav />;
export const ActiveEvents = () => <Nav active="#/events" />;
export const NoCta = () => <Nav cta={null} />;
