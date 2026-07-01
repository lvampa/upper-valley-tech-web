import { Pill } from './Pill.tsx';

export default { title: 'Core / Pill' };

export const Default = () => <Pill>NH + VT · est. 2025</Pill>;
export const NoDot = () => <Pill dot={false}>NH + VT · est. 2025</Pill>;
