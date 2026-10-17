import type { MovingReport } from '../engine/movingRisk';

/**
 * Demo report in the shape POST /api/moving/report will return (context/backendMovingPlan.md §6).
 * Figures come from the open-data samples in server/data/opendata and context/if.md.
 * Partner offers are placeholders until If confirms the partners.
 */
export const demoMovingReport: MovingReport = {
  summary: {
    moveDate: '2026-11-15',
    fromAddress: '01300 Vantaa',
    toAddress: '00100 Helsinki',
    homeLabel: 'Rented flat, ground floor',
  },
  categories: [
    { id: 'transport', name: 'Transport damage' },
    { id: 'schedule', name: 'Schedule delay' },
    { id: 'keys', name: 'Key safety' },
    { id: 'property', name: 'New home' },
  ],
  flags: [
    {
      id: 'transit-damage',
      category: 'transport',
      severity: 'medium',
      title: 'Fragile items on a self-move',
      why: 'You plan to carry a TV and a glass cabinet yourself. Stairwells and van loading are where knocks and drops happen.',
      evidence: 'Your answers: moving yourself, fragile items',
    },
    {
      id: 'road-accident',
      category: 'transport',
      severity: 'low',
      title: 'Driving a rented van in the city',
      why: 'A larger vehicle on unfamiliar streets needs more room to stop and turn.',
      evidence: 'Helsinki had 302 road accidents with injuries in 2024 (Statistics Finland)',
    },
    {
      id: 'schedule-delay',
      category: 'schedule',
      severity: 'low',
      title: 'Route not checked yet',
      why: 'Road works and closures are announced about a week ahead. We will check your route again on 8 November.',
      evidence: 'Digitraffic traffic messages, checked 17 October',
    },
    {
      id: 'burglary',
      category: 'keys',
      severity: 'medium',
      title: 'Ground-floor flat',
      why: 'Street-level windows and doors are easier to reach, and a pile of boxes shows that a home is changing hands.',
      evidence: 'Your answer: ground floor',
      estimateEur: 1000,
    },
    {
      id: 'key-handover',
      category: 'keys',
      severity: 'medium',
      title: "Previous tenants' keys",
      why: 'In a rental you cannot know how many copies are still out there. A new lock cylinder costs far less than a burglary.',
      evidence: 'Your answer: rented flat with previous tenants',
    },
    {
      id: 'old-plumbing',
      category: 'property',
      severity: 'medium',
      title: 'Pipes in a 1942 building',
      why: 'Buildings this old have usually had a pipe renovation, but not always. The housing company knows when the last one was done.',
      evidence: 'Completed in 1942 (HSY building register)',
      estimateEur: 4300,
    },
    {
      id: 'fire-safety',
      category: 'property',
      severity: 'medium',
      title: 'Smoke alarm at the new address',
      why: 'Residents are responsible for a working smoke alarm. In 2024, 605 home fires in Finland happened where there was none.',
      evidence: 'Pelastusopisto PRONTO statistics, 2024',
      estimateEur: 36796,
    },
  ],
  actions: [
    {
      id: 'book-mover',
      title: 'Book a verified mover',
      resolves: ['transit-damage', 'road-accident'],
      partnerOffer: 'Member price with partner movers',
    },
    {
      id: 'rent-tools',
      title: 'Rent a dolly and moving straps',
      resolves: ['transit-damage'],
      partnerOffer: 'Free tool rental for annual members',
    },
    {
      id: 'buffer-day',
      title: 'Keep 16 November free as a buffer day',
      resolves: ['schedule-delay'],
    },
    {
      id: 'route-check',
      title: 'Turn on the route check for 8 November',
      resolves: ['schedule-delay'],
    },
    {
      id: 'change-lock',
      title: 'Ask the landlord to change the lock cylinder',
      resolves: ['key-handover'],
    },
    {
      id: 'boxes-out-of-sight',
      title: 'Keep boxes and new electronics out of sight from the street',
      resolves: ['burglary'],
    },
    {
      id: 'ask-pipes',
      title: 'Ask the housing company about the last pipe renovation',
      resolves: ['old-plumbing'],
    },
    {
      id: 'smoke-alarm',
      title: 'Test the smoke alarm on your first evening',
      resolves: ['fire-safety'],
    },
  ],
  protectionGaps: [
    {
      id: 'contents-both-homes',
      status: 'covered',
      title: 'Your belongings are covered in both homes',
      detail:
        'If home insurance covers your contents at the old and the new address for 3 months after the move.',
      suggestion: 'Tell If your new address',
    },
    {
      id: 'transport-cover',
      status: 'gap',
      title: 'Moving damage is not in your Perus level',
      detail:
        'Things that break while you carry or drive them are covered from the Laaja level up.',
      suggestion: 'Compare home insurance levels',
    },
    {
      id: 'water-damage',
      status: 'partial',
      title: 'Water damage is split with the housing company',
      detail:
        'Your policy covers your own belongings. Pipes and structures fall under the housing company’s insurance.',
      suggestion: 'Fit a leak sensor under the sink',
    },
  ],
  sources: [
    'HSY building register',
    'Statistics Finland',
    'Fintraffic Digitraffic',
    'Pelastusopisto PRONTO',
    'If home insurance terms',
  ],
};
