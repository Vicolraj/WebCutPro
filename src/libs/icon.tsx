export const icons = {
  play: "M5 3l14 9-14 9V3z",
  pause: "M6 4h4v16H6V4zm8 0h4v16h-4V4z",
  skipBack: "M19 20L9 12l10-8v16zM5 4v16",
  skipFwd: "M5 4l10 8-10 8V4zM19 4v16",
  stepBack: "M15 18l-6-6 6-6M9 6v12",
  stepFwd: "M9 18l6-6-6-6M15 6v12",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  film: "M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4",
  music: "M9 18V5l12-2v13M9 18a3 3 0 01-6 0 3 3 0 016 0zM21 16a3 3 0 01-6 0 3 3 0 016 0z",
  image: "M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14l6-3 3 5 3-5 6 3z",
  scissors: "M6 3a3 3 0 100 6 3 3 0 000-6zM6 15a3 3 0 100 6 3 3 0 000-6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12",
  undo: "M3 7v6h6M3.51 15a9 9 0 101.49-5.33",
  redo: "M21 7v6h-6M20.49 15a9 9 0 10-1.49-5.33",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  zoomIn: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35M11 8v6M8 11h6",
  zoomOut: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35M8 11h6",
  magnet: "M6 3a6 6 0 016 6v3m0 0v-3a6 6 0 016 6m-6 0v3M12 12H3M12 12h9",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  close: "M18 6L6 18M6 6l12 12",
  chevDown: "M6 9l6 6 6-6",
  chevRight: "M9 18l6-6-6-6",
  save: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  volume: "M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07",
  marker: "M12 2a5 5 0 015 5c0 4-5 11-5 11S7 11 7 7a5 5 0 015-5zm0 4a1 1 0 100 2 1 1 0 000-2z",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  mute: "M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6",
  wand: "M15 4l5 5M5 20L4 16l11-9 5 5-9 11L5 20z",
  export: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 3v13M7 8l5-5 5 5",
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
export const Icon: SVGAElement = ({ d, size = 16, color = C.textSec, fill = "none", ...rest } : {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} {...rest}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
