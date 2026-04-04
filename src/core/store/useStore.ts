import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';

export interface TimelineClip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  sourceStart: number;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image';
  mediaId?: string;  // Link to IndexedDB MediaAsset
  blob: string;     // Active session Blob URL
  isSelected?: boolean;
  content?: string;  // For text clips
  thumbnail?: string; // Optional thumbnail URL
  style?: {
    fontSize: number;
    fontFamily: string;
    color: string;
    x: number;
    y: number;
  };
}

export type TrackType = 'video' | 'audio';

export type TransitionType = 'crossfade' | 'wipe' | 'slide' | 'dissolve';

export interface Transition {
  id: string;
  type: TransitionType;
  duration: number;
  clipAId: string;
  clipBId: string;
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  name: string;
  isMuted: boolean;
  isLocked: boolean;
  isSolo: boolean;
}


export interface ProjectStore {
  projectId: string;
  projectName: string;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  transitions: Transition[];
  
  // Actions
  setProjectId: (id: string) => void;
  setProjectName: (name: string) => void;
  loadProjectData: (data: Partial<ProjectStore>) => void;
  addTrack: (track: TimelineTrack) => void;
  toggleMute: (trackId: string) => void;
  toggleLock: (trackId: string) => void;
  addClip: (clip: TimelineClip) => void;
  updateClip: (clipId: string, changes: Partial<TimelineClip>) => void;
  removeClip: (clipId: string) => void;
  deleteAsset: (assetId: string) => void;
  selectClip: (clipId: string | null) => void;
  splitClip: (clipId: string, time: number) => void;
  rippleRemoveClip: (clipId: string) => void;
  addTransition: (trans: Omit<Transition, 'id'>) => void;
  resetProject: () => void;
}




export const useProjectStore = create<ProjectStore>()(
  temporal(
    immer((set) => ({
      projectId: 'default-project',
      projectName: 'Untitled Project',
      tracks: [
        { id: 'v1', type: 'video', name: 'Video 1', isMuted: false, isLocked: false, isSolo: false },
        { id: 'v2', type: 'video', name: 'Video 2', isMuted: false, isLocked: false, isSolo: false },
        { id: 'a1', type: 'audio', name: 'Audio 1', isMuted: false, isLocked: false, isSolo: false },
      ],
      clips: [],
      transitions: [],
      
      setProjectId: (id: string) =>
        set((state: ProjectStore) => {
          state.projectId = id;
        }),

      setProjectName: (name: string) =>
        set((state: ProjectStore) => {
          state.projectName = name;
        }),

      loadProjectData: (data: Partial<ProjectStore>) =>
        set((state: ProjectStore) => {
          if (data.projectId) state.projectId = data.projectId;
          if (data.projectName) state.projectName = data.projectName;
          if (data.tracks) state.tracks = data.tracks;
          if (data.clips) state.clips = data.clips;
          if (data.transitions) state.transitions = data.transitions;
        }),

      addTrack: (track: TimelineTrack) => 
        set((state: ProjectStore) => {
          state.tracks.push(track);
        }),

      toggleMute: (trackId: string) => 
        set((state: ProjectStore) => {
          const track = state.tracks.find(t => t.id === trackId);
          if (track) track.isMuted = !track.isMuted;
        }),

      toggleLock: (trackId: string) => 
        set((state: ProjectStore) => {
          const track = state.tracks.find(t => t.id === trackId);
          if (track) track.isLocked = !track.isLocked;
        }),

      addClip: (clip: TimelineClip) => 
        set((state: ProjectStore) => {
          state.clips.push(clip);
        }),

      updateClip: (clipId: string, changes: Partial<TimelineClip>) => 
        set((state: ProjectStore) => {
          const clip = state.clips.find(c => c.id === clipId);
          if (clip) Object.assign(clip, changes);
        }),

      removeClip: (clipId: string) => 
        set((state: ProjectStore) => {
          state.clips = state.clips.filter(c => c.id !== clipId);
        }),

      deleteAsset: (assetId: string) =>
        set((state: ProjectStore) => {
          // Remove all clips associated with this asset
          state.clips = state.clips.filter(c => c.mediaId !== assetId);
        }),

      selectClip: (clipId: string | null) => 
        set((state: ProjectStore) => {
          state.clips.forEach(c => c.isSelected = c.id === clipId);
        }),

      splitClip: (clipId: string, time: number) => 
        set((state: ProjectStore) => {
          const index = state.clips.findIndex(c => c.id === clipId);
          if (index === -1) return;
          
          const clip = state.clips[index];
          const relativeTime = time - clip.startTime;
          
          if (relativeTime <= 0 || relativeTime >= clip.duration) return;

          const newClip: TimelineClip = {
            ...clip,
            id: Math.random().toString(36).substring(2, 9),
            startTime: time,
            duration: clip.duration - relativeTime,
            sourceStart: clip.sourceStart + relativeTime,
            isSelected: false
          };

          clip.duration = relativeTime;
          state.clips.push(newClip);
        }),

      rippleRemoveClip: (clipId: string) => 
        set((state: ProjectStore) => {
          const clip = state.clips.find(c => c.id === clipId);
          if (!clip) return;
          
          const { startTime, duration, trackId } = clip;
          state.clips = state.clips.filter(c => c.id !== clipId);
          
          // Shift subsequent clips on the same track
          state.clips.forEach(c => {
            if (c.trackId === trackId && c.startTime > startTime) {
              c.startTime -= duration;
            }
          });
        }),

      addTransition: (trans) => 
        set((state: ProjectStore) => {
          state.transitions.push({ ...trans, id: Math.random().toString(36).slice(2, 9) });
        }),

      resetProject: () =>
        set((state: ProjectStore) => {
          state.projectId = 'default-project';
          state.projectName = 'Untitled Project';
          state.tracks = [
            { id: 'v1', type: 'video', name: 'Video 1', isMuted: false, isLocked: false, isSolo: false },
            { id: 'v2', type: 'video', name: 'Video 2', isMuted: false, isLocked: false, isSolo: false },
            { id: 'a1', type: 'audio', name: 'Audio 1', isMuted: false, isLocked: false, isSolo: false },
          ];
          state.clips = [];
          state.transitions = [];
        }),
    }))
  )
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
