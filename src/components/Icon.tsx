const paths = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  paw: (
    <>
      <circle cx="6" cy="10" r="1.8" />
      <circle cx="9.5" cy="5.5" r="1.8" />
      <circle cx="14.5" cy="5.5" r="1.8" />
      <circle cx="18" cy="10" r="1.8" />
      <path d="M12 11c-2.6 0-5 3.6-5 6.2 0 1.6 1.2 2.6 2.7 2.6 1 0 1.5-.5 2.3-.5s1.3.5 2.3.5c1.5 0 2.7-1 2.7-2.6 0-2.6-2.4-6.2-5-6.2Z" />
    </>
  ),
  plane: (
    <path d="M10.5 13.5 4 11l1.5-1.5 7 .5 4-4c.8-.8 2.2-.8 3 0s.8 2.2 0 3l-4 4 .5 7L14.5 21 12 14.5l-3 3V20l-1.5 1.5-1-3.5-3.5-1L4.5 15.5H7Z" />
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.3 2.3 4.7-4.8" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0 5 5L21 12.6a6 6 0 0 1-7.4 1.4L7 20.6a2 2 0 0 1-2.8-2.8L10.8 11a6 6 0 0 1 1.4-7.4l1.3 1.3a4 4 0 0 0 1.2 1.4Z" />
  ),
  stethoscope: (
    <>
      <path d="M5 3v5a5 5 0 0 0 10 0V3" />
      <path d="M10 13v2a5 5 0 0 0 10 0v-1" />
      <circle cx="20" cy="12" r="2" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3Z" />
      <path d="M14 9h4l3 3.5V16h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9" />
      <path d="m17 6 3 3" />
      <path d="m14.5 8.5 2 2" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V6l8-3 8 3v15" />
      <path d="M9.5 21v-4h5v4" />
      <path d="M8 9h1M15 9h1M8 13h1M15 13h1" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 2.5 20h19Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  shield: <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6Z" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  ruler: (
    <>
      <path d="M3 16 16 3l5 5L8 21Z" />
      <path d="m7 12 2 2M10 9l2 2M13 6l2 2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4 2 2 0 0 0 0-4V6H3Z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
      <path d="M9 3h6v3H9ZM8.5 11h7M8.5 15h5" />
    </>
  ),
};

export type IconName = keyof typeof paths;

type IconProps = { name: IconName; className?: string };

export function Icon({ name, className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
