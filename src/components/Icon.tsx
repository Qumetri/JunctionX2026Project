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
