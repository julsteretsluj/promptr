export type IconName =
  | 'shower'
  | 'dishes'
  | 'room'
  | 'teeth'
  | 'makeup'
  | 'dressed'
  | 'homework'
  | 'shopping'
  | 'laundry'
  | 'bed'
  | 'meal'
  | 'leave'
  | 'plus'
  | 'check'
  | 'chevron'
  | 'back'
  | 'sparkle'

export const ICON_NAMES: IconName[] = [
  'shower',
  'dishes',
  'room',
  'teeth',
  'makeup',
  'dressed',
  'homework',
  'shopping',
  'laundry',
  'bed',
  'meal',
  'leave',
  'sparkle',
]

export function isIconName(value: string): value is IconName {
  return (ICON_NAMES as string[]).includes(value) ||
    value === 'plus' ||
    value === 'check' ||
    value === 'chevron' ||
    value === 'back'
}

type Props = {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 28, className }: Props) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 28 28',
    fill: 'none',
    className,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'shower':
      return (
        <svg {...props}>
          <path d="M7 12h14v2.5a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V12Z" stroke="currentColor" strokeWidth="2" />
          <path d="M10 7.5V5.5a4 4 0 0 1 8 0V7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 22v1.5M14 22v2M19 22v1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'dishes':
      return (
        <svg {...props}>
          <ellipse cx="14" cy="16" rx="9" ry="5.5" stroke="currentColor" strokeWidth="2" />
          <path d="M5 16c0-4 4-7.5 9-7.5s9 3.5 9 7.5" stroke="currentColor" strokeWidth="2" />
          <path d="M9 11.5c1.2-1 3-1.6 5-1.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'room':
      return (
        <svg {...props}>
          <path d="M5 12.5 14 5l9 7.5V23a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M11 24v-7h6v7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'teeth':
      return (
        <svg {...props}>
          <path d="M8 6.5h12c1.2 0 2.2 1.1 2 2.3l-1.2 8.2c-.3 1.8-1.7 3-3.4 3h-.6c-1.1 0-2-.7-2.3-1.7L14 14l-.5 4.3c-.3 1-.1.2-1.2 1.7h-.6c-1.7 0-3.1-1.2-3.4-3L7 8.8C6.8 7.6 7.8 6.5 9 6.5H8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'makeup':
      return (
        <svg {...props}>
          <rect x="11" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M11 13h6v8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-8Z" stroke="currentColor" strokeWidth="2" />
          <path d="M13 7h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'dressed':
      return (
        <svg {...props}>
          <path d="M10 5.5 14 8l4-2.5 3.5 3.5-3 2V23H9.5V11l-3-2L10 5.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'homework':
      return (
        <svg {...props}>
          <rect x="6" y="4" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M10 10h8M10 14h8M10 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'shopping':
      return (
        <svg {...props}>
          <path d="M5 8h18l-1.5 12.5a2 2 0 0 1-2 1.5H8.5a2 2 0 0 1-2-1.5L5 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M10 8V7a4 4 0 0 1 8 0v1" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'laundry':
      return (
        <svg {...props}>
          <rect x="5" y="3.5" width="18" height="21" rx="3" stroke="currentColor" strokeWidth="2" />
          <circle cx="14" cy="15" r="5.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="14" cy="15" r="2" fill="currentColor" />
          <path d="M8 7h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'bed':
      return (
        <svg {...props}>
          <path d="M4 14h20v7H4v-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M4 14V9.5A2.5 2.5 0 0 1 6.5 7H12v7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M4 21v2M24 21v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'meal':
      return (
        <svg {...props}>
          <path d="M8 4v9a3 3 0 0 0 3 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 4v5M6 4v5M10 4v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 4v20M18 4c2.5 0 4 2 4 5.5S20.5 15 18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'leave':
      return (
        <svg {...props}>
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H15v20H7.5A2.5 2.5 0 0 1 5 21.5v-15Z" stroke="currentColor" strokeWidth="2" />
          <path d="M15 14h8m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...props}>
          <path d="M14 7v14M7 14h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    case 'check':
      return (
        <svg {...props}>
          <path d="M7 14.5 11.5 19 21 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...props}>
          <path d="M11 7l6 7-6 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'back':
      return (
        <svg {...props}>
          <path d="M17 6 9 14l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...props}>
          <path d="M14 4l1.8 5.2L21 11l-5.2 1.8L14 18l-1.8-5.2L7 11l5.2-1.8L14 4Z" fill="currentColor" />
          <path d="M21 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" fill="currentColor" />
        </svg>
      )
  }
}
