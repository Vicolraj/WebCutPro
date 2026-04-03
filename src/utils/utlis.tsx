export const formatTime = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.floor((s % 1) * 10);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}.${ms}`;
};
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const uid = () => Math.random().toString(36).slice(2, 9);