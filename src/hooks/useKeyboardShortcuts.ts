import { useEffect } from 'react';
import { useProjectStore, usePlaybackStore } from '../core/store/useStore';

export const useKeyboardShortcuts = () => {
  const { isPlaying, setIsPlaying, playhead, setPlayhead } = usePlaybackStore();
  const { clips, removeClip, splitClip, rippleRemoveClip } = useProjectStore();


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        
        case 'KeyS':
          const selectedClip = clips.find(c => c.isSelected);
          if (selectedClip && playhead >= selectedClip.startTime && playhead <= selectedClip.startTime + selectedClip.duration) {
             splitClip(selectedClip.id, playhead);
          }
          break;

        case 'Backspace':
        case 'Delete':
           const clipToDelete = clips.find(c => c.isSelected);
           if (clipToDelete) {
              if (e.altKey) {
                rippleRemoveClip(clipToDelete.id);
              } else {
                removeClip(clipToDelete.id);
              }
           }
           break;


        case 'Home':
          setPlayhead(0);
          break;

        case 'End':
          const lastClip = clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0);
          setPlayhead(lastClip);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, setIsPlaying, clips, removeClip, splitClip, playhead, setPlayhead]);
};
