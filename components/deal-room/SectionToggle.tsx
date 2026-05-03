'use client';

// Chevron icon used as a collapse/expand indicator in section headers.
export default function SectionToggle({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-midgray transition-transform ${collapsed ? '-rotate-90' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
