import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useProjectStore, type TimelineTrack } from '../../../core/store/useStore';

interface TrackHeaderProps {
  track: TimelineTrack;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track }) => {
  const { toggleMute, toggleLock } = useProjectStore();

  return (
    <div className="w-[180px] shrink-0 border-r border-border bg-panel h-[52px] flex items-center justify-between px-3 z-20 group">
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <span className="text-[10px] font-bold text-textSec uppercase tracking-tight truncate">
          {track.name}
        </span>
        <div className="flex items-center gap-1">
          <div className={`w-1 h-3 rounded-full ${track.type === 'video' ? 'bg-accent' : 'bg-green-500'}`} />
          <span className="text-[8px] text-textDim uppercase font-mono">{track.type}</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={() => toggleMute(track.id)}
          title={track.isMuted ? 'Unmute' : 'Mute'}
        >
          {track.isMuted ? <VolumeX size={12} className="text-red-400" /> : <Volume2 size={12} />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={() => toggleLock(track.id)}
          title={track.isLocked ? 'Unlock' : 'Lock'}
        >
          {track.isLocked ? <Lock size={12} className="text-accent" /> : <Unlock size={12} />}
        </Button>
      </div>
    </div>
  );
};
