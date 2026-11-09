import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeading, Period } from '@components/core/PageHeading.tsx';

describe('PageHeading', () => {
  it('ends the title in a full stop by default', () => {
    // given / when
    render(
      <PageHeading
        kicker="Events"
        title={
          <>
            What's coming up
            <Period />
          </>
        }
      />,
    );

    // then
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe("What's coming up.");
  });

  it('ends the title in the mark it is given', () => {
    // given / when
    render(
      <PageHeading
        kicker="About"
        title={
          <>
            Why Upper Valley Tech
            <Period mark="?" />
          </>
        }
      />,
    );

    // then
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Why Upper Valley Tech?');
  });
});
