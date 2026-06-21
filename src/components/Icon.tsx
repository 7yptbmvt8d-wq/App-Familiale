type IconName =
  | 'home'
  | 'pin'
  | 'calendar'
  | 'photo'
  | 'tree'
  | 'lock'
  | 'plus'
  | 'heart'
  | 'comment'
  | 'chevron-right'
  | 'battery'
  | 'speed'
  | 'sliders'
  | 'check'
  | 'close'
  | 'send'
  | 'users'
  | 'sparkle'
  | 'ticket'
  | 'feed'
  | 'camera'
  | 'trash'
  | 'pencil'
  | 'logout';

interface Props {
  name: IconName;
  size?: number;
  filled?: boolean;
  stroke?: number;
  className?: string;
}

/** Jeu d'icônes au trait (1.7–1.9px). Pas d'emoji, pas de SVG illustratif. */
export function Icon({ name, size = 22, filled = false, stroke = 1.8, className }: Props) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
  const fc = filled ? 'currentColor' : 'none';

  switch (name) {
    case 'home':
      return (
        <svg {...p}>
          <path
            d="M4 10.8 11.3 4.3a1 1 0 0 1 1.4 0L20 10.8V19a1 1 0 0 1-1 1h-4v-5h-4v5H5a1 1 0 0 1-1-1z"
            fill={fc}
          />
        </svg>
      );
    case 'pin':
      return (
        <svg {...p}>
          <path
            d="M12 21c4.4-4 6.5-7.1 6.5-10.3A6.5 6.5 0 0 0 5.5 10.7C5.5 13.9 7.6 17 12 21z"
            fill={fc}
          />
          <circle cx="12" cy="10.4" r="2.4" fill={filled ? '#FBF6EE' : 'none'} />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...p}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.6" fill={fc} />
          <path d="M3.5 9.2h17" stroke={filled ? '#FBF6EE' : 'currentColor'} />
          <path d="M8 3.4v3.4M16 3.4v3.4" />
        </svg>
      );
    case 'photo':
      return (
        <svg {...p}>
          <rect x="3.5" y="5" width="17" height="14" rx="2.6" fill={fc} />
          <circle cx="8.6" cy="10" r="1.6" fill={filled ? '#FBF6EE' : 'none'} stroke={filled ? 'none' : 'currentColor'} />
          <path d="M5 17.5 10 12.6l3 2.6 3-2.8 3 3" stroke={filled ? '#FBF6EE' : 'currentColor'} />
        </svg>
      );
    case 'tree':
      return (
        <svg {...p}>
          <path d="M12 7.4v3.2M7.5 16.4l3.2-3.4M16.5 16.4l-3.2-3.4" />
          <circle cx="12" cy="5.2" r="2.4" fill={fc} />
          <circle cx="6.4" cy="18" r="2.4" fill={fc} />
          <circle cx="17.6" cy="18" r="2.4" fill={fc} />
        </svg>
      );
    case 'lock':
      return (
        <svg {...p}>
          <rect x="5" y="10.5" width="14" height="9.5" rx="2.4" fill={fc} />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...p}>
          <path d="M12 5.5v13M5.5 12h13" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...p}>
          <path
            d="M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7-2.3A4 4 0 0 1 19 10.7C19 15.6 12 20 12 20z"
            fill={fc}
          />
        </svg>
      );
    case 'comment':
      return (
        <svg {...p}>
          <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3v-3H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5z" />
        </svg>
      );
    case 'chevron-right':
      return (
        <svg {...p}>
          <path d="M9 5.5 15.5 12 9 18.5" />
        </svg>
      );
    case 'battery':
      return (
        <svg {...p}>
          <rect x="3" y="8" width="16" height="8" rx="2" />
          <path d="M21 11v2" />
        </svg>
      );
    case 'speed':
      return (
        <svg {...p}>
          <path d="M5 18a8 8 0 1 1 14 0" />
          <path d="M12 14.5 15.5 9.5" />
        </svg>
      );
    case 'sliders':
      return (
        <svg {...p}>
          <path d="M5 8h9M5 16h5" />
          <circle cx="17" cy="8" r="2.3" />
          <circle cx="13" cy="16" r="2.3" />
        </svg>
      );
    case 'check':
      return (
        <svg {...p}>
          <path d="M5 12.5 10 17.5 19 7" />
        </svg>
      );
    case 'close':
      return (
        <svg {...p}>
          <path d="M6 6 18 18M18 6 6 18" />
        </svg>
      );
    case 'send':
      return (
        <svg {...p}>
          <path d="M5 12 19 5l-4.5 14-3.2-5.4z" fill={fc} />
        </svg>
      );
    case 'users':
      return (
        <svg {...p}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M16 6.2a3 3 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-2-3.4" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...p}>
          <path d="M12 4c.6 4 1.9 5.4 6 6-4.1.6-5.4 2-6 6-.6-4-1.9-5.4-6-6 4.1-.6 5.4-2 6-6z" fill={fc} />
        </svg>
      );
    case 'ticket':
      return (
        <svg {...p}>
          <path d="M4 7.5h16v3a1.7 1.7 0 0 0 0 3.4v3.6H4v-3.6a1.7 1.7 0 0 0 0-3.4z" />
          <path d="M13 7.5v9" strokeDasharray="1.4 2.2" />
        </svg>
      );
    case 'feed':
      return (
        <svg {...p}>
          <rect x="4" y="4.5" width="16" height="6.4" rx="2" fill={fc} />
          <rect x="4" y="13.1" width="16" height="6.4" rx="2" fill={fc} />
        </svg>
      );
    case 'camera':
      return (
        <svg {...p}>
          <path
            d="M4 8.5h3l1.2-2h6.6l1.2 2H20a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V10A1.5 1.5 0 0 1 4 8.5z"
            fill={fc}
          />
          <circle cx="12" cy="13.5" r="3.1" fill={filled ? '#FBF6EE' : 'none'} stroke={filled ? 'none' : 'currentColor'} />
        </svg>
      );
    case 'trash':
      return (
        <svg {...p}>
          <path d="M4.5 7h15M9 7V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V7" />
          <path d="M6.5 7l.8 11.1A1.6 1.6 0 0 0 8.9 19.6h6.2a1.6 1.6 0 0 0 1.6-1.5L17.5 7" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      );
    case 'pencil':
      return (
        <svg {...p}>
          <path d="M14.5 6.5 17.5 9.5M4.5 19.5l.9-3.4 9.6-9.6a1.6 1.6 0 0 1 2.3 0l1 1a1.6 1.6 0 0 1 0 2.3l-9.6 9.6z" fill={fc} />
        </svg>
      );
    case 'logout':
      return (
        <svg {...p}>
          <path d="M14 5.5H6a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 6 18.5h8" />
          <path d="M14 12H21M18 9l3 3-3 3" />
        </svg>
      );
  }
}
