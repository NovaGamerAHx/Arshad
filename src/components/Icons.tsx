import type { ReactNode, SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: P) => (
  <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></Svg>
);
export const IconToday = (p: P) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="m9 15.5 2 2 4-4" /></Svg>
);
export const IconLayers = (p: P) => (
  <Svg {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /><path d="m3 17.5 9 5 9-5" opacity=".45" /></Svg>
);
export const IconInbox = (p: P) => (
  <Svg {...p}><path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M3 13h5l1.5 2.5h5L16 13h5" /></Svg>
);
export const IconChart = (p: P) => (
  <Svg {...p}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-5M12.5 16V7M17 16v-8" strokeWidth="2.2" /></Svg>
);
export const IconNote = (p: P) => (
  <Svg {...p}><path d="M6 3h9l4 4v14H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5" /><path d="M9 13h7M9 17h5" /></Svg>
);
export const IconBoard = (p: P) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M7 21h10M12 18v3" /><path d="m7.5 12.5 2.5-4 2.5 3 2-2.5 2 3.5" /></Svg>
);
export const IconGear = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.4M12 19.1v2.4M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2" strokeWidth="2" /></Svg>
);
export const IconPlus = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconCheck = (p: P) => <Svg {...p}><path d="m4.5 12.5 5 5 10-11" /></Svg>;
export const IconX = (p: P) => <Svg {...p}><path d="m6 6 12 12M18 6 6 18" /></Svg>;
export const IconChevronDown = (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const IconChevronL = (p: P) => <Svg {...p}><path d="m14 6-6 6 6 6" /></Svg>;
export const IconChevronR = (p: P) => <Svg {...p}><path d="m10 6 6 6-6 6" /></Svg>;
export const IconDots = (p: P) => (
  <Svg {...p}><circle cx="12" cy="5.5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="18.5" r="1" fill="currentColor" /></Svg>
);
export const IconPencil = (p: P) => (
  <Svg {...p}><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17l-1 3Z" /><path d="m14.5 7.5 3 3" /></Svg>
);
export const IconTrash = (p: P) => (
  <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" /><path d="M10 11v5M14 11v5" /></Svg>
);
export const IconUp = (p: P) => <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>;
export const IconDown = (p: P) => <Svg {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>;
export const IconCalendar = (p: P) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>
);
export const IconClock = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const IconSearch = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.5-4.5" /></Svg>;
export const IconDownload = (p: P) => (
  <Svg {...p}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M4 19h16" /></Svg>
);
export const IconUpload = (p: P) => (
  <Svg {...p}><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 19h16" /></Svg>
);
export const IconReset = (p: P) => (
  <Svg {...p}><path d="M4 5v5h5" /><path d="M4.5 10A8 8 0 1 1 4 14" /></Svg>
);
export const IconBook = (p: P) => (
  <Svg {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" /><path d="M9 8h7" /></Svg>
);
export const IconCopy = (p: P) => (
  <Svg {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Svg>
);
export const IconGrip = (p: P) => (
  <Svg {...p} strokeWidth={0}><circle cx="9" cy="6" r="1.3" fill="currentColor" /><circle cx="15" cy="6" r="1.3" fill="currentColor" /><circle cx="9" cy="12" r="1.3" fill="currentColor" /><circle cx="15" cy="12" r="1.3" fill="currentColor" /><circle cx="9" cy="18" r="1.3" fill="currentColor" /><circle cx="15" cy="18" r="1.3" fill="currentColor" /></Svg>
);
export const IconFlame = (p: P) => (
  <Svg {...p}><path d="M12 3s5.5 4.5 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 8.5 9 7 9 4.5c1.5 1 2.5 2.5 3 4C12.5 6.5 12 4.5 12 3Z" /></Svg>
);
export const IconTarget = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></Svg>
);
export const IconCap = (p: P) => (
  <Svg {...p}><path d="m2.5 9 9.5-5 9.5 5-9.5 5-9.5-5Z" /><path d="M6.5 11.2v4.3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.3" /><path d="M21.5 9v5" /></Svg>
);
export const IconBack = (p: P) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
export const IconKanban = (p: P) => (
  <Svg {...p}><rect x="3.5" y="4" width="4.8" height="16" rx="1.2" /><rect x="9.8" y="4" width="4.8" height="11" rx="1.2" /><rect x="16" y="4" width="4.8" height="7" rx="1.2" /></Svg>
);
export const IconList = (p: P) => (
  <Svg {...p}><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4.5" cy="6" r="1" fill="currentColor" /><circle cx="4.5" cy="12" r="1" fill="currentColor" /><circle cx="4.5" cy="18" r="1" fill="currentColor" /></Svg>
);
export const IconSun = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" /></Svg>
);
export const IconMoon = (p: P) => (
  <Svg {...p}><path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z" /></Svg>
);
export const IconMenu = (p: P) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
export const IconSpark = (p: P) => (
  <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></Svg>
);
export const IconInfo = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" /></Svg>
);
export const IconSave = (p: P) => (
  <Svg {...p}><path d="M5 3h11l3 3v15H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M8 3v5h7V3" /><rect x="8" y="13" width="8" height="8" /></Svg>
);
export const IconStar = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="m12 3.6 2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.6Z" />
  </Svg>
);
export const IconPin = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M9 3.5h6l-.7 5 3 3.7a.6.6 0 0 1-.5 1H7.2a.6.6 0 0 1-.5-1l3-3.7-.7-5Z" />
    <path d="M12 13.5V21" />
  </Svg>
);
