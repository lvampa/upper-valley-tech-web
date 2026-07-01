import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '@components/events/EventCard.tsx';

describe('EventCard', () => {
  describe('compact variant', () => {
    it('renders the date parts, title, and an RSVP action', () => {
      // given / when
      render(
        <EventCard
          variant="compact"
          month="Jul"
          day="16"
          weekday="Wed"
          title="Lightning Talks & Pizza"
          time="6:30 PM"
          location="Lebanon, NH"
          rsvpHref="https://lu.ma/uvt-test"
          rsvpLabel="RSVP"
        />,
      );
      // then
      expect(screen.getByText('Lightning Talks & Pizza')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
      expect(screen.getByText(/6:30 PM/)).toBeInTheDocument();
      // RSVP renders as an external link to the event's rsvpHref (a Luma page)
      expect(screen.getByRole('link', { name: 'RSVP' })).toHaveAttribute(
        'href',
        'https://lu.ma/uvt-test',
      );
    });

    it('omits the RSVP link when the event has no rsvpHref', () => {
      // given an event without an RSVP link / when rendered
      render(
        <EventCard
          variant="compact"
          month="Jul"
          day="16"
          weekday="Wed"
          title="Topic TBD"
          time="6:30 PM"
          location="Lebanon, NH"
        />,
      );
      // then no RSVP action is shown (no dead link)
      expect(screen.queryByRole('link', { name: 'RSVP' })).toBeNull();
    });
  });

  describe('featured variant', () => {
    it('renders the kicker, title, location, and meta lines', () => {
      render(
        <EventCard
          variant="featured"
          kicker="Next meetup · Thu Jul 16"
          month="Jul"
          day="16"
          title="Lightning Talks & Pizza"
          location="CCBA, Lebanon NH"
          meta={['Doors 6:30 · Talks 7:00']}
        />,
      );
      expect(screen.getByText('Next meetup · Thu Jul 16')).toBeInTheDocument();
      expect(screen.getByText('Lightning Talks & Pizza')).toBeInTheDocument();
      expect(screen.getByText('CCBA, Lebanon NH')).toBeInTheDocument();
      expect(screen.getByText('Doors 6:30 · Talks 7:00')).toBeInTheDocument();
    });
  });

  describe('row variant', () => {
    it('renders day, title, location, and time', () => {
      render(
        <EventCard
          variant="row"
          href="#/events"
          day="Thu Aug 20"
          title="Topic TBD"
          location="Lebanon, NH"
          time="6:30 PM"
        />,
      );
      expect(screen.getByText('Thu Aug 20')).toBeInTheDocument();
      expect(screen.getByText('Topic TBD')).toBeInTheDocument();
      expect(screen.getByText('Lebanon, NH')).toBeInTheDocument();
      expect(screen.getByText('6:30 PM')).toBeInTheDocument();
    });
  });
});
