import { LOGO } from '../brand/logo';

/** The Minh Quang Bespoke logo, drawn from its traced outline so it stays sharp at any size. */
export function Logo({ title, className }: { title: string; className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${LOGO.w} ${LOGO.h}`} role="img" aria-label={title} focusable="false">
      <path d={LOGO.d} fill={LOGO.color} fillRule="evenodd" />
    </svg>
  );
}
