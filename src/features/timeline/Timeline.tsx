import React, { useRef, useState, useEffect } from 'react';
import { useUIStore, usePlaybackStore, useProjectStore } from '../../core/store/useStore';
import { 
  Scissors, 
  Plus, 
  Magnet, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

const HEADER_WIDTH = 180;


import { TrackHeader } from './components/TrackHeader';

import { TimelineClip } from './components/TimelineClip';
import { DroppableTrack } from './components/DroppableTrack';

export const Timeline: React.FC = () => {
  const { zoom, setZoom } = useUIStore();
  const { playhead, setPlayhead, duration } = usePlaybackStore();
  const { tracks, clips, addTrack, updateClip } = useProjectStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [draggedClip, setDraggedClip] = useState<null | { id: string, startX: number, startTime: number }>(null);

  const timeToX = (t: number) => t * zoom;
  const xToTime = (x: number) => x / zoom;

  const handleRulerInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left - HEADER_WIDTH + scrollRef.current.scrollLeft;
    setPlayhead(Math.max(0, xToTime(x)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    handleRulerInteraction(e);
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (isScrubbing) {
        handleRulerInteraction(e as any);
      }
      
      if (draggedClip) {
        const deltaX = (e.clientX - draggedClip.startX) / zoom;
        updateClip(draggedClip.id, { startTime: Math.max(0, draggedClip.startTime + deltaX) });
      }
    };

    const handleGlobalUp = () => {
      setIsScrubbing(false);
      setDraggedClip(null);
    };

    if (isScrubbing || draggedClip) {
      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('mouseup', handleGlobalUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isScrubbing, draggedClip, zoom, updateClip]);

  const handleAddTrack = () => {
    const id = `v${tracks.length + 1}`;
    addTrack({
      id,
      type: 'video',
      name: `Video ${tracks.filter(t => t.type === 'video').length + 1}`,
      isMuted: false,
      isLocked: false,
      isSolo: false
    });
  };

  return (
    <div className="flex flex-col h-full bg-panel relative overflow-hidden select-none">
      {/* Timeline Toolbar */}
      <div className="h-10 border-b border-border flex items-center justify-between px-3 z-10 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Razor (C)">
            <Scissors size={14} className="text-textSec" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button variant="ghost" size="icon" title="Snapping (N)" active>
             <Magnet size={14} className="text-accent" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-[10px] uppercase font-bold text-textSec"
            onClick={handleAddTrack}
          >
             <Plus size={12} /> Add Track
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface border border-border rounded-px6 p-0.5">
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(10, zoom / 1.2))}>
              <ZoomOut size={14} />
            </Button>
            <div className="w-px h-3 bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(500, zoom * 1.2))}>
              <ZoomIn size={14} />
            </Button>
            <div className="w-px h-3 bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={() => setZoom(60)}>
               <Maximize size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative scroll-smooth bg-[#0F0F16]"
      >
        <div style={{ minWidth: timeToX(duration) + HEADER_WIDTH + 400, position: 'relative' }}>
          
          {/* Ruler */}
          <div 
            className="h-8 border-b border-border bg-panel sticky top-0 z-30 cursor-crosshair"
            onMouseDown={onMouseDown}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[180px] border-r border-border bg-panel flex items-center px-4">
               <Clock size={12} className="text-textDim mr-2" />
               <span className="text-[10px] font-mono text-textSec uppercase tracking-wider">Timeline</span>
            </div>
            
            <div className="relative h-full" style={{ marginLeft: HEADER_WIDTH }}>
              {/* Ticks */}
              {Array.from({ length: Math.ceil(duration / 5) + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bottom-0 border-l border-border h-2"
                  style={{ left: timeToX(i * 5) }}
                >
                  <span className="absolute left-1 bottom-2 text-[9px] font-mono text-textDim italic whitespace-nowrap">
                    {Math.floor((i * 5) / 60)}:{String((i * 5) % 60).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks Area */}
          <div className="relative">
            {/* Playhead Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-accent z-40 pointer-events-none"
              style={{ left: timeToX(playhead) + HEADER_WIDTH }}
            >
              <div className="w-3 h-3 bg-accent rounded-full -ml-[5px] -mt-1 shadow-lg shadow-accent/50" />
            </div>

            {/* Real Tracks */}
            {tracks.map((track) => (
              <div key={track.id} className="flex border-b border-border/10 overflow-hidden">
                <TrackHeader track={track} />
                <DroppableTrack id={track.id}>
                   {/* Clips for this track */}
                   {clips.filter(c => c.trackId === track.id).map(clip => (
                      <TimelineClip key={clip.id} clip={clip} />
                   ))}
                </DroppableTrack>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

