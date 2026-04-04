import React, { useState } from 'react';
import { useUIStore, useProjectStore, usePlaybackStore, type TimelineClip as ClipType } from '../../../core/store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useWaveform } from '../../media/hooks/useWaveform';
import { ContextMenu } from '../../../components/ui/ContextMenu';
import { Scissors, Trash2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimelineClipProps {
  clip: ClipType;
}

export const TimelineClip: React.FC<TimelineClipProps> = ({ clip }) => {
  const { zoom } = useUIStore();
  const { playhead } = usePlaybackStore();
  const { updateClip, selectClip, removeClip, splitClip } = useProjectStore();
  const { waveform } = useWaveform(clip.mediaId, 200); // Increased resolution

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const left = clip.startTime * zoom;
  const width = clip.duration * zoom;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectClip(clip.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleResizeStart = (dir: 'left' | 'right') => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const startStartTime = clip.startTime;
    const startDuration = clip.duration;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      
      if (dir === 'left') {
        const newStart = Math.max(0, startStartTime + deltaX);
        const newDuration = Math.max(0.1, startDuration - (newStart - startStartTime));
        updateClip(clip.id, { startTime: newStart, duration: newDuration });
      } else {
        const newDuration = Math.max(0.1, startDuration + deltaX);
        updateClip(clip.id, { duration: newDuration });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      <div
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        className={cn(
          "absolute h-[44px] top-1 rounded-px6 overflow-hidden border transition-all cursor-move select-none",
          clip.isSelected ? "border-white ring-2 ring-accent/50 z-50 shadow-xl" : "border-white/10 z-10",
          clip.type === 'video' ? "bg-accent/20" : 
          clip.type === 'audio' ? "bg-green-500/20" : 
          clip.type === 'image' ? "bg-purple-500/20" : "bg-gray-500/20"
        )}
        style={{ left, width }}
      >
        {/* Filmstrip / Thumbnail Background */}
        {(clip.type === 'video' || clip.type === 'image') && clip.thumbnail && (
          <div className="absolute inset-0 flex pointer-events-none opacity-30">
            {Array.from({ length: Math.ceil(width / 60) }).map((_, i) => (
              <img 
                key={i}
                src={clip.thumbnail} 
                alt="" 
                className="h-full w-[60px] object-cover border-r border-black/20" 
              />
            ))}
          </div>
        )}

        {/* Waveform Background (for audio/video) */}
        {(clip.type === 'video' || clip.type === 'audio') && waveform && (
          <div className="absolute inset-0 opacity-40 pointer-events-none">
             <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${waveform.length} 44`}>
               <path 
                  d={`M 0 22 ${Array.from(waveform).map((pt: number, i: number) => `L ${i} ${22 - pt * 20}`).join(' ')} L ${waveform.length} 22 L 0 22 Z`} 
                  fill="currentColor" 
                  className={clip.type === 'video' ? 'text-accent' : 'text-green-400'}
               />
             </svg>
          </div>
        )}

        {/* Resizing Handles */}
        <div 
          onMouseDown={handleResizeStart('left')}
          className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/30 cursor-col-resize z-20 transition-colors" 
        />
        <div 
          onMouseDown={handleResizeStart('right')}
          className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/30 cursor-col-resize z-20 transition-colors" 
        />

        {/* Clip Content Overlay */}
        <div className="flex items-center h-full px-2 gap-2 relative z-10">
          <span className="text-[10px] font-bold truncate text-white/90 drop-shadow-md bg-black/20 px-1 rounded-px2">
            {clip.name}
          </span>
        </div>

        {/* Selection Border */}
        {clip.isSelected && (
          <div className="absolute inset-0 border-2 border-accent pointer-events-none" />
        )}
      </div>

      <ContextMenu 
        isOpen={!!contextMenu}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        onClose={() => setContextMenu(null)}
        options={[
          {
            label: 'Split Clip',
            icon: <Scissors size={14} />,
            onClick: () => splitClip(clip.id, playhead)
          },
          { 
            label: 'Delete Clip', 
            icon: <Trash2 size={14} />, 
            variant: 'danger',
            onClick: () => removeClip(clip.id)
          }
        ]}
      />
    </>
  );
};
