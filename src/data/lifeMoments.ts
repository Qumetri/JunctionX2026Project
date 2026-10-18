import type { IconName } from '../components/Icon';

export type LifeMoment = {
  id: 'moving' | 'pet-care' | 'travel' | 'seniors';
  name: string;
  icon: IconName;
  /** One line shown in the hero preview panel. */
  teaser: string;
  /** Readiness (0–100) in the hero preview panel; the home page replaces it with real progress. */
  readiness: number;
  services: string[];
};

export const lifeMoments: LifeMoment[] = [
  {
    id: 'moving',
    name: 'Moving',
    icon: 'home',
    teaser: 'Verified movers, tool rental and a moving-day checklist',
    readiness: 62,
    services: [
      'Verified mover discounts',
      'Van and tool rental',
      'Single-trip insurance by IF',
      'Moving checklist and safety tips',
    ],
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    icon: 'paw',
    teaser: 'Deworming and vaccine reminders',
    readiness: 40,
    services: [
      'Remote vet consultations',
      'Deworming and vaccine reminders',
      'Pet travel tips',
      'Single-trip pet cover by IF',
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: 'plane',
    teaser: 'Destination risks and medical guidance',
    readiness: 25,
    services: [
      'Travel risk checks',
      'Medical support guidance',
      'Trip cancellation support',
      'Flexible cover by IF',
    ],
  },
  {
    id: 'seniors',
    name: 'Seniors',
    icon: 'heart',
    teaser: 'Fall prevention, help at home and scam safety',
    readiness: 0,
    services: [
      'Home safety checklist',
      'Help with heavy chores',
      'Technology and scam guidance',
      'Safety phone and home care tips',
    ],
  },
];

export const memberBenefits: { icon: IconName; text: string }[] = [
  { icon: 'wrench', text: 'Free tool rental for annual members' },
  { icon: 'stethoscope', text: 'Free remote vet sessions for members' },
  { icon: 'tag', text: 'Partner discounts across the IF ecosystem' },
];
