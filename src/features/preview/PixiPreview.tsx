import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
// @ts-ignore - Some versions of @pixi/react v8 have incomplete type declarations
import { Stage, Sprite, Container } from '@pixi/react';
import { usePlaybackStore, useProjectStore } from '../../core/store/useStore';
import { db } from '../../libs/db';



export const PixiPreview: React.FC = () => {
  const { playhead } = usePlaybackStore();
  const { clips } = useProjectStore();

  const [textures, setTextures] = useState<Map<string, PIXI.Texture>>(new Map());

  // Force Pixi to re-render when playhead changes
  useEffect(() => {
    // 1. Logic to update textures based on playhead
    const currentClips = clips.filter(c => 
       playhead >= c.startTime && playhead <= c.startTime + c.duration
    );

    // 2. Load textures for current clips if not already loaded
    const loadTextures = async () => {
       const nextTextures = new Map(textures);
       let updated = false;

       for (const clip of currentClips) {
          if (!nextTextures.has(clip.id)) {
             try {
                const asset = await db.assets.get(clip.mediaId);
                if (asset) {
                   const url = URL.createObjectURL(asset.blob);
                   const texture = PIXI.Texture.from(url);
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
  }, [playhead, clips, textures]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
      <Stage 
        width={1920} 
        height={1080} 
        options={{ 
          backgroundColor: 0x000000, 
          antialias: true,
          resolution: window.devicePixelRatio || 1
        }}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      >
        <Container>
          {clips
            .filter(c => playhead >= c.startTime && playhead <= c.startTime + c.duration)
            .map((clip, index) => {
               const texture = textures.get(clip.id);
               if (!texture) return null;

               // Calculate Alpha for Transitions
               let alpha = 1;
               const transition = useProjectStore.getState().transitions.find(t => t.clipAId === clip.id || t.clipBId === clip.id);
               
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
                 <Sprite
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
        </Container>
      </Stage>
    </div>
  );

};
