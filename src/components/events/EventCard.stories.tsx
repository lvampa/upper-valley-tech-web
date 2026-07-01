import { EventCard } from './EventCard.tsx';

export default { title: 'Events / EventCard' };

export const Compact = () => (
  <div style={{ maxWidth: 520 }}>
    <EventCard
      variant="compact"
      month="Jul"
      day="16"
      weekday="Thu"
      title="Lightning Talks & Pizza"
      time="6:30 PM"
      location="Lebanon, NH"
      rsvpHref="https://lu.ma/example"
    />
  </div>
);

export const Featured = () => (
  <div style={{ maxWidth: 440 }}>
    <EventCard
      variant="featured"
      kicker="Next meetup · Thu Jul 16"
      month="Jul"
      day="16"
      title="Lightning Talks & Pizza"
      location="CCBA Witherell Recreation Center, Lebanon NH"
      meta={['Doors 6:30 · Talks 7:00 · Hang 8:00']}
      rsvpHref="https://lu.ma/example"
    />
  </div>
);

export const Row = () => (
  <div style={{ maxWidth: 520 }}>
    <EventCard
      variant="row"
      href="#"
      day="Thu Aug 20"
      title="Topic TBD"
      location="Lebanon, NH"
      time="6:30 PM"
    />
    <EventCard
      variant="row"
      href="#"
      day="Wed Sep 17"
      title="Topic TBD"
      location="White River Jct, VT"
      time="6:30 PM"
    />
    <EventCard
      variant="row"
      past
      day="Jun 18"
      title="Intros, demos & cider"
      location="Lebanon, NH"
      time="12 here"
    />
  </div>
);
