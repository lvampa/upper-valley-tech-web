import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from '@screens/HomeScreen.tsx';
import { useEvents } from '@lib/useEvents.ts';
import { type Event } from '@lib/types.ts';

vi.mock('@lib/useEvents.ts', () => ({ useEvents: vi.fn() }));
// Stub the captcha hook so SubscribeSection has no DOM/network side effects.
vi.mock('@lib/useHCaptchaSubscribe.ts', () => ({
  useHCaptchaSubscribe: () => ({
    status: 'idle',
    captchaRef: { current: null },
    handleSubmit: vi.fn(),
  }),
}));
const mockUseEvents = vi.mocked(useEvents);

// far-future date so the real selectNext always treats this as the next meetup
const future: Event = {
  id: 'jul-2025',
  date: '2999-07-16',
  title: 'Lightning Talks & Pizza',
  location: 'Lebanon, NH',
  time: '6:30 PM',
};

beforeEach(() => {
  mockUseEvents.mockReset();
});

describe('HomeScreen', () => {
  it('given loading, shows the loading affordance', () => {
    mockUseEvents.mockReturnValue({ events: [], status: 'loading' });
    render(<HomeScreen />);
    expect(screen.getByText('Loading events…')).toBeInTheDocument();
  });

  it('given an error, shows the error line', () => {
    mockUseEvents.mockReturnValue({ events: [], status: 'error' });
    render(<HomeScreen />);
    expect(screen.getByText(/Couldn't load events/)).toBeInTheDocument();
  });

  it('given events, shows the next meetup', () => {
    mockUseEvents.mockReturnValue({ events: [future], status: 'success' });
    render(<HomeScreen />);
    expect(screen.getByText('Next meetup')).toBeInTheDocument();
    expect(screen.getByText('Lightning Talks & Pizza')).toBeInTheDocument();
  });
});
