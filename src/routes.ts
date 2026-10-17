export const routes = [
  'home',
  'risk-report',
  'moving',
  'moving-plan',
  'travel',
  'pet-care',
  'seniors',
  'member-benefits',
] as const;
export type Route = (typeof routes)[number];
