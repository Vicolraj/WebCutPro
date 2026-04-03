import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ProjectStore {
  projectName: string;
  setProjectName: (name: string) => void;
  // tracks, clips, etc. to be added in Phase 2
}

export const useProjectStore = create<ProjectStore>()(
  immer((set) => ({
    projectName: 'Untitled Project',
    setProjectName: (name) =>
      set((state) => {
        state.projectName = name;
      }),
  }))
);

export interface UIStore {
  leftPanelWidth: number;
  rightPanelWidth: number;
  timelineHeight: number;
  activeTab: string;
  zoom: number;
  setLeftPanelWidth: (w: number) => void;
  setRightPanelWidth: (w: number) => void;
  setTimelineHeight: (h: number) => void;
  setActiveTab: (tab: string) => void;
  setZoom: (z: number) => void;
}

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    leftPanelWidth: 320,
    rightPanelWidth: 300,
    timelineHeight: 320,
    activeTab: 'media',
    zoom: 60,
    setLeftPanelWidth: (w) => set((state) => { state.leftPanelWidth = w; }),
    setRightPanelWidth: (w) => set((state) => { state.rightPanelWidth = w; }),
    setTimelineHeight: (h) => set((state) => { state.timelineHeight = h; }),
    setActiveTab: (tab) => set((state) => { state.activeTab = tab; }),
    setZoom: (z) => set((state) => { state.zoom = z; }),
  }))
);

export interface PlaybackStore {
  playhead: number;
  isPlaying: boolean;
  duration: number;
  setPlayhead: (t: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setDuration: (d: number) => void;
}

export const usePlaybackStore = create<PlaybackStore>()(
  immer((set) => ({
    playhead: 0,
    isPlaying: false,
    duration: 30,
    setPlayhead: (t) => set((state) => { state.playhead = t; }),
    setIsPlaying: (playing) => set((state) => { state.isPlaying = playing; }),
    setDuration: (d) => set((state) => { state.duration = d; }),
  }))
);
