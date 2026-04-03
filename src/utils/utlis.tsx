export const formatTime = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${ms}`;
};

export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export const uid = (): string => Math.random().toString(36).slice(2, 9);