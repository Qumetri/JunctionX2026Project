export const routes = ['home', 'risk-report', 'moving', 'travel', 'member-benefits'] as const;
export type Route = (typeof routes)[number];
