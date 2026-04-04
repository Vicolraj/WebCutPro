import React, { useEffect, useState } from 'react';
import { Container, Sprite, Texture, Assets } from 'pixi.js';
import { Application, extend } from '@pixi/react';
import { usePlaybackStore, useProjectStore } from '../../core/store/useStore';
import { db } from '../../libs/db';

// Register PixiJS components to be used as JSX elements
extend({ Container, Sprite });

export const PixiPreview: React.FC = () => {
  const { playhead } = usePlaybackStore();
  const { clips, transitions } = useProjectStore();

  const [textures, setTextures] = useState<Map<string, Texture>>(new Map());

  // Handle texture loading for current clips
  useEffect(() => {
    const currentClips = clips.filter(c => 
       playhead >= c.startTime && playhead <= c.startTime + c.duration
    );

    const loadTextures = async () => {
       const nextTextures = new Map(textures);
       let updated = false;

       for (const clip of currentClips) {
          if (!nextTextures.has(clip.id) && clip.mediaId) {
             try {
                const asset = await db.assets.get(clip.mediaId);
                if (asset) {
                   const url = URL.createObjectURL(asset.blob);
                   const texture = await Assets.load(url);
                   nextTextures.set(clip.id, texture);
                   updated = true;
                }
             } catch (e) {
                console.error('Failed to load pixi texture', clip.id, e);
             }
          }
       }

       if (updated) setTextures(nextTextures);
    };

    loadTextures();
    
    // Cleanup old textures if needed (simplified for now)
  }, [playhead, clips, textures]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
      <Application 
        width={1920} 
        height={1080} 
        background="#000000"
        antialias={true}
        resolution={window.devicePixelRatio || 1}
      >
        <pixiContainer>
          {clips
            .filter(c => playhead >= c.startTime && playhead <= c.startTime + c.duration)
            .map((clip, index) => {
               const texture = textures.get(clip.id);
               if (!texture) return null;

               // Calculate Alpha for Transitions
               let alpha = 1;
               const transition = transitions.find(t => t.clipAId === clip.id || t.clipBId === clip.id);
               
               if (transition) {
                  const clipA = clips.find(c => c.id === transition.clipAId);
                  const clipB = clips.find(c => c.id === transition.clipBId);
                  
                  if (clipA && clipB) {
                     const transStart = clipB.startTime;
                     const transEnd = transStart + transition.duration;
                     
                     if (playhead >= transStart && playhead <= transEnd) {
                        const progress = (playhead - transStart) / transition.duration;
                        if (clip.id === transition.clipAId) {
                           alpha = 1 - progress;
                        } else {
                           alpha = progress;
                        }
                     }
                  }
               }

               return (
                 <pixiSprite
                   key={clip.id}
                   texture={texture}
                   anchor={0.5}
                   alpha={alpha}
                   x={1920 / 2}
                   y={1080 / 2}
                   zIndex={index}
                 />
               );
            })}
        </pixiContainer>
      </Application>
    </div>
  );
};
