import React from 'react';
import { Stage, Layer, Text, Transformer } from 'react-konva';
import { useProjectStore } from '../../../core/store/useStore';
import { usePlaybackStore } from '../../../core/store/useStore';

export const TextOverlay: React.FC = () => {
  const { clips, updateClip, selectClip } = useProjectStore();
  const { playhead } = usePlaybackStore();

  const activeTextClips = clips.filter(c => 
    c.type === 'text' && 
    playhead >= c.startTime && 
    playhead <= c.startTime + c.duration
  );

  if (activeTextClips.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <Stage 
        width={1920} 
        height={1080} 
        className="pointer-events-auto w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Layer>
          {activeTextClips.map((clip) => (
            <React.Fragment key={clip.id}>
              <Text 
                text={clip.name}
                fontSize={64}
                fill="white"
                draggable
                x={1920 / 2 - 100}
                y={1080 / 2}
                onClick={() => selectClip(clip.id)}
                onDragEnd={(e) => {
                   // In a real app we would store X, Y in the clip state
                   // updateClip(clip.id, { x: e.target.x(), y: e.target.y() });
                   console.log('Text moved to:', e.target.x(), e.target.y());
                }}
              />
              {clip.isSelected && (
                <Transformer />
              )}
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
