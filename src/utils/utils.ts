import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats time in seconds to MM:SS.m or H:MM:SS
 */
export const formatTime = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${ms}`;
};

/**
 * Clamps a value between a minimum and maximum
 */
export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

/**
 * Generates a random unique ID
 */
export const uid = (): string => Math.random().toString(36).slice(2, 9);
