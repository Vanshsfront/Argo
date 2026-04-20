import { cn } from "@/lib/cn";

type Props = { className?: string; strokeWidth?: number };

const base = "shrink-0";
const defaults = "w-5 h-5";

function make(pathD: string) {
  return function Icon({ className, strokeWidth = 1.75 }: Props) {
    return (
      <svg
        className={cn(base, defaults, className)}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={pathD} />
      </svg>
    );
  };
}

export const HomeIcon = make(
  "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10",
);
export const UsersIcon = make(
  "M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M15 7a4 4 0 11-8 0 4 4 0 018 0zM21 21v-2a4 4 0 00-3-3.87M17 3.13a4 4 0 010 7.75",
);
export const BriefcaseIcon = make(
  "M3 7h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18",
);
export const SparkIcon = make(
  "M12 3v4M12 17v4M3 12h4M17 12h4M5.64 5.64l2.83 2.83M15.54 15.54l2.83 2.83M5.64 18.36l2.83-2.83M15.54 8.46l2.83-2.83",
);
export const CashIcon = make(
  "M3 7h18v10H3V7zM12 10a2 2 0 100 4 2 2 0 000-4zM6 7V5M18 7V5",
);
export const PlusIcon = make("M12 5v14M5 12h14");
export const CheckIcon = make("M5 13l4 4L19 7");
export const ChevronLeftIcon = make("M15 18l-6-6 6-6");
export const ChevronRightIcon = make("M9 6l6 6-6 6");
export const ChevronDownIcon = make("M6 9l6 6 6-6");
export const CloseIcon = make("M6 6l12 12M18 6L6 18");
export const MenuIcon = make("M4 7h16M4 12h16M4 17h16");
export const SearchIcon = make("M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z");
export const DragIcon = make(
  "M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01",
);
export const ArrowRightIcon = make("M5 12h14M13 5l7 7-7 7");
export const TrashIcon = make("M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14");
export const LogoutIcon = make("M15 12H3M15 12l-4-4m4 4l-4 4M21 3v18M21 3h-6M21 21h-6");
export const SettingsIcon = make(
  "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
);
export const CalendarIcon = make(
  "M4 7h16v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7zM4 7V5a1 1 0 011-1h14a1 1 0 011 1v2M8 3v4M16 3v4",
);
export const LinkIcon = make(
  "M10 14a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1 1M14 10a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1-1",
);
export const ClipboardIcon = make(
  "M9 4h6a1 1 0 011 1v1h1a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2h1V5a1 1 0 011-1zM9 4v2h6V4",
);
export const KanbanIcon = make(
  "M4 5h4v14H4zM10 5h4v8h-4zM16 5h4v11h-4z",
);
export const ListIcon = make(
  "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
);
export const DownloadIcon = make(
  "M12 3v12M7 10l5 5 5-5M4 19h16",
);
