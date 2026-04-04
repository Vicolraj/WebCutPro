import React, { useState } from 'react';
import { usePlaybackStore, useProjectStore } from '../../core/store/useStore';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  ChevronDown
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PixiPreview } from './PixiPreview';
import { TextOverlay } from './components/TextOverlay';
import { audioEngine } from '../audio/AudioEngine';
import { useDraggable } from '@dnd-kit/core';

export const PreviewPlayer: React.FC = () => {
  const { playhead, setPlayhead, isPlaying, setIsPlaying, duration } = usePlaybackStore();
  const { clips } = useProjectStore();
  const [aspectRatio] = useState('16:9');
  const [volume, setVolume] = useState(1);
  const [isMuted] = useState(false);

  const togglePlay = () => {
    if (!isPlaying) {
      audioEngine.init();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] relative overflow-hidden group font-sans">
      {/* Top Controls */}
      <div className="flex items-center justify-between p-2 absolute top-0 left-0 right-0 z-20 transition-all">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-[10px] uppercase font-bold text-textSec bg-panel/50 backdrop-blur-md">
            {aspectRatio} 
            <ChevronDown size={12} />
          </Button>
          <div className="h-4 w-px bg-white/10" />
           <span className="text-[10px] font-mono text-textSec uppercase tracking-widest bg-panel/50 px-2 py-0.5 rounded-full backdrop-blur-md">
             Full HD
           </span>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="bg-panel/50 backdrop-blur-md">
              <MoreVertical size={14} />
           </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-12 overflow-hidden bg-dot-pattern">
        <div 
          className="relative shadow-2xl shadow-black/80 ring-1 ring-white/10 overflow-hidden bg-black transition-all group-hover:scale-[1.01]"
          style={{
            aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '9:16' ? '9/16' : '1/1',
            maxHeight: '100%',
            maxWidth: '100%'
          }}
        >
          {/* Main Video Engine (PixiJS Layer) */}
          <PixiPreview />
          
          {/* Text Overlay Engine (Konva Layer) */}
          <TextOverlay />

          {/* Empty State Overlay */}
          {clips.length === 0 && (

            <div className="absolute inset-0 flex flex-col items-center justify-center text-textDim gap-4 animate-pulse pointer-events-none">
              <Monitor size={64} strokeWidth={1} />
              <p className="text-xs uppercase tracking-widest font-bold font-mono">No Media Selected</p>
            </div>
          )}

          {/* Timecode Overlay */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-lg border border-white/10 px-3 py-1 rounded-px6 z-50">
            <span className="text-sm font-mono text-white font-bold tabular-nums">
               {formatTime(playhead)}
            </span>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="h-14 bg-panel border-t border-border flex items-center px-4 shrink-0 justify-between">
         <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setPlayhead(0)}>
               <SkipBack size={18} />
            </Button>
            <Button 
               variant="primary" 
               size="icon" 
               className="mx-1 h-9 w-9 rounded-full shadow-lg shadow-accent/40 scale-105 active:scale-95"
               onClick={togglePlay}
            >
               {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setPlayhead(duration)}>
               <SkipForward size={18} />
            </Button>
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg group/volume">
               {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
               <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 accent-accent bg-border rounded-lg cursor-pointer"
               />
            </div>
            
            <div className="w-px h-4 bg-border" />
            
            <Button variant="ghost" size="icon">
               <Maximize2 size={18} />
            </Button>
         </div>
      </div>
    </div>
  );
};
