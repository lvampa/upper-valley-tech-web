import { Button } from './Button.tsx';

export default { title: 'Core / Button' };

export const Primary = () => <Button variant="primary">RSVP</Button>;
export const Ghost = () => <Button variant="ghost">Add to calendar</Button>;
export const Text = () => <Button variant="text">See all events →</Button>;
export const Nav = () => <Button variant="nav">Join mailing list</Button>;

export const Sizes = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Button variant="primary" size="sm">
      Small
    </Button>
    <Button variant="primary" size="md">
      Medium
    </Button>
    <Button variant="primary" size="lg">
      Large
    </Button>
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Button variant="primary" status="idle">
      Idle
    </Button>
    <Button variant="primary" status="loading">
      Loading
    </Button>
    <Button variant="primary" status="success">
      Success
    </Button>
    <Button variant="primary" status="error">
      Error
    </Button>
    <Button variant="primary" disabled>
      Disabled
    </Button>
  </div>
);
