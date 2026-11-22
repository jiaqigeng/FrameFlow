const paths = {
  plus: "M12 5v14M5 12h14",
  dashboard: "M3.5 3.5h7v7h-7zM14 3.5h6.5v7H14zM3.5 14h7v6.5h-7zM14 14h6.5v6.5H14z",
  library: "M3 7.5h18v12H3zM6 4.5h12M10 11l5 2.5-5 2.5z",
  queue: "M8 6h12M8 12h12M8 18h12M3.5 6h.1M3.5 12h.1M3.5 18h.1",
  search: "M16.1 16.1 21 21M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0z",
  device: "M4.5 4.5h15v11h-15zM2.5 19h19",
  external: "M7 17 17 7M7 7h10v10",
  menu: "M3.5 6.5h17M3.5 12h17M3.5 17.5h17",
  close: "m6 6 12 12M18 6 6 18",
};

export function WorkspaceIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
