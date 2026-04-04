import React, { useCallback, useRef } from 'react';
import { useUIStore, useProjectStore, usePlaybackStore } from '../../core/store/useStore';
import { DndContext, type DragEndEvent, type DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { db } from '../../libs/db';
import { Upload } from 'lucide-react';


interface EditorLayoutProps {
  topbar: React.ReactNode;
  leftPanel: React.ReactNode;
  preview: React.ReactNode;
  rightPanel: React.ReactNode;
  timeline: React.ReactNode;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  topbar,
  leftPanel,
  preview,
  rightPanel,
  timeline,
}) => {
  const { 
    leftPanelWidth, 
    setLeftPanelWidth, 
    rightPanelWidth, 
    setRightPanelWidth,
    timelineHeight,
    setTimelineHeight 
  } = useUIStore();

  const isResizingRef = useRef<string | null>(null);
  const [activeAsset, setActiveAsset] = React.useState<any>(null);

  const handleMouseDown = (type: string) => (_e: React.MouseEvent) => {
    isResizingRef.current = type;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = type.includes('Width') ? 'col-resize' : 'row-resize';
  };


  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;

    if (isResizingRef.current === 'leftWidth') {
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setLeftPanelWidth(newWidth);
    } else if (isResizingRef.current === 'rightWidth') {
      const newWidth = Math.max(200, Math.min(500, window.innerWidth - e.clientX));
      setRightPanelWidth(newWidth);
    } else if (isResizingRef.current === 'timelineHeight') {
      const newHeight = Math.max(150, Math.min(window.innerHeight - 200, window.innerHeight - e.clientY));
      setTimelineHeight(newHeight);
    }
  }, [setLeftPanelWidth, setRightPanelWidth, setTimelineHeight]);

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  const { addClip } = useProjectStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveAsset(event.active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveAsset(null);
    const { active, over } = event;
    if (!over) return;

    const assetId = active.id as string;
    const overId = over.id as string;

    try {
      const asset = await db.assets.get(assetId);
      if (asset) {
        let clipType: 'video' | 'audio' | 'image' | 'text' = 'video';
        if (asset.type.includes('video')) clipType = 'video';
        else if (asset.type.includes('audio')) clipType = 'audio';
        else if (asset.type.includes('image')) clipType = 'image';

        addClip({
          id: Math.random().toString(36).substring(2, 9),
          trackId: overId.startsWith('track-') ? overId.replace('track-', '') : overId,
          startTime: usePlaybackStore.getState().playhead,
          duration: clipType === 'image' ? 5 : (asset.duration || 5),
          sourceStart: 0,
          name: asset.name,
          type: clipType,
          mediaId: asset.id,
          blob: URL.createObjectURL(asset.blob),
          thumbnail: asset.thumbnail
        });
      }
    } catch (e) {
      console.error('Drag drop failed', e);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen w-screen bg-[#0A0A0F] text-text overflow-hidden font-sans">
        {/* Topbar */}
        <header className="flex-shrink-0 z-50">
          {topbar}
        </header>

        {/* Main Workspace */}
        <main className="flex flex-1 overflow-hidden relative">
          {/* Left Panel */}
          <aside 
            className="bg-[#12121A] border-r border-white/5 relative flex flex-col overflow-hidden shadow-2xl"
            style={{ width: leftPanelWidth }}
          >
            {leftPanel}
            <div 
              onMouseDown={handleMouseDown('leftWidth')}
              className="absolute right-0 top-0 bottom-0 w-1 hover:bg-accent/50 cursor-col-resize z-10 transition-colors"
            />
          </aside>

          {/* Preview & Right Panels */}
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <div className="flex flex-1 overflow-hidden relative">
              <section className="flex-1 bg-[#050508] overflow-hidden relative flex flex-col">
                {preview}
              </section>

              {/* Right Panel */}
              <aside 
                className="bg-[#12121A] border-l border-white/5 relative flex flex-col overflow-hidden"
                style={{ width: rightPanelWidth }}
              >
                <div 
                  onMouseDown={handleMouseDown('rightWidth')}
                  className="absolute left-0 top-0 bottom-0 w-1 hover:bg-accent/50 cursor-col-resize z-10 transition-colors"
                />
                {rightPanel}
              </aside>
            </div>

            {/* Timeline Panel */}
            <section 
              className="bg-[#0F0F16] border-t border-white/5 relative flex flex-col overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.3)]"
              style={{ height: timelineHeight }}
            >
              <div 
                onMouseDown={handleMouseDown('timelineHeight')}
                className="absolute top-0 left-0 right-0 h-1 hover:bg-accent/50 cursor-row-resize z-10 transition-colors"
              />
              {timeline}
            </section>
          </div>
        </main>
        
        <DragOverlay dropAnimation={null}>
          {activeAsset ? (
            <div className="bg-accent/20 border-2 border-accent rounded-lg p-3 shadow-2xl backdrop-blur-md flex items-center gap-3 min-w-[160px] pointer-events-none rotate-3 scale-110 transition-transform">
               {activeAsset.thumbnail ? (
                 <img src={activeAsset.thumbnail} className="w-10 h-10 rounded object-cover border border-white/20" />
               ) : (
                 <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-accent">
                   <Upload size={20} />
                 </div>
               )}
               <div className="flex flex-col">
                 <span className="text-[11px] font-bold text-white truncate max-w-[100px]">{activeAsset.name}</span>
                 <span className="text-[9px] text-accent/70 uppercase font-mono tracking-tighter">{activeAsset.type.split('/')[1]}</span>
               </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
