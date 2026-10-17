export const routes = [
  'home',
  'risk-report',
  'moving',
  'moving-plan',
  'travel',
  'member-benefits',
] as const;
export type Route = (typeof routes)[number];
