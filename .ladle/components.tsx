import type { GlobalProvider } from '@ladle/react';
import '../src/styles/index.css';

export const Provider: GlobalProvider = ({ children }) => (
  <div className="uvt-ambient" style={{ minHeight: '100vh', padding: 32 }}>
    <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
  </div>
);
