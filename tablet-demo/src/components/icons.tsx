/** Small UI glyphs (line icons, currentColor). Never used to illustrate a garment option. */

interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
});

export function CheckIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function ExpandIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </svg>
  );
}

export function ChevronIcon({ size = 20, className, dir = 'down' }: IconProps & { dir?: 'down' | 'up' | 'left' | 'right' }) {
  const rot = { down: 0, up: 180, left: 90, right: -90 }[dir];
  return (
    <svg {...base(size)} className={className} style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function CloseIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function EditIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </svg>
  );
}

export function ArrowIcon({ size = 18, className, dir = 'right' }: IconProps & { dir?: 'right' | 'left' }) {
  return (
    <svg {...base(size)} strokeWidth={2} className={className}>
      <path d={dir === 'right' ? 'M5 12h14M13 6l6 6-6 6' : 'M19 12H5M11 6l-6 6 6 6'} />
    </svg>
  );
}

export function MinusIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function PlusIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 12h12M12 6v12" />
    </svg>
  );
}

export function SparkleIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.8} className={className}>
      <path d="M12 3l2 5.2 5.2 2-5.2 2L12 17.4l-2-5.2-5.2-2 5.2-2z" />
    </svg>
  );
}
