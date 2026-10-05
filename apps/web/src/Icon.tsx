export type IconName =
  | 'today'
  | 'create'
  | 'trace'
  | 'data'
  | 'about'
  | 'arrow'
  | 'clock'
  | 'pin'
  | 'tray'
  | 'warning'
  | 'qr'
  | 'local';
const paths: Record<IconName, string> = {
  today: 'M3 10h7V3H3v7Zm11 11h7v-7h-7v7ZM3 21h7v-7H3v7Zm11-11h7V3h-7v7Z',
  create: 'M12 5v14M5 12h14',
  trace: 'm20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  data: 'M4 5c0-3 16-3 16 0s-16 3-16 0Zm0 0v14c0 3 16 3 16 0V5M4 12c0 3 16 3 16 0',
  about: 'M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  clock: 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  tray: 'M3 14h18l-2 6H5l-2-6ZM5 11a7 7 0 0 1 14 0M12 2v2',
  warning: 'm12 3 10 18H2L12 3Zm0 6v5m0 3v.01',
  qr: 'M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h3v3h3v3h-6v-6ZM3 12h6m3-9v3m0 3v3h6m3 0v3m-9 3v3',
  local: 'M7 3h10v18H7V3Zm4 15h2',
};
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={'icon ' + className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
