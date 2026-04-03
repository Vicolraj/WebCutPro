import React, { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../../core/store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  return (
    <div className="flex flex-col h-screen w-screen bg-bg text-text overflow-hidden font-sans">
      {/* Topbar */}
      <header className="flex-shrink-0 z-50">
        {topbar}
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left Panel */}
        <aside 
          className="bg-panel border-r border-border relative flex flex-col overflow-hidden"
          style={{ width: leftPanelWidth }}
        >
          {leftPanel}
          <div 
            onMouseDown={handleMouseDown('leftWidth')}
            className="absolute right-0 top-0 bottom-0 w-1 hover:bg-accent cursor-col-resize z-10 transition-colors"
          />
        </aside>

        {/* Preview & Right Panels */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <div className="flex flex-1 overflow-hidden relative">
            <section className="flex-1 bg-bg overflow-hidden relative flex flex-col">
              {preview}
            </section>

            {/* Right Panel */}
            <aside 
              className="bg-panel border-l border-border relative flex flex-col overflow-hidden"
              style={{ width: rightPanelWidth }}
            >
              <div 
                onMouseDown={handleMouseDown('rightWidth')}
                className="absolute left-0 top-0 bottom-0 w-1 hover:bg-accent cursor-col-resize z-10 transition-colors"
              />
              {rightPanel}
            </aside>
          </div>

          {/* Timeline Panel */}
          <section 
            className="bg-panel border-t border-border relative flex flex-col overflow-hidden"
            style={{ height: timelineHeight }}
          >
            <div 
              onMouseDown={handleMouseDown('timelineHeight')}
              className="absolute top-0 left-0 right-0 h-1 hover:bg-accent cursor-row-resize z-10 transition-colors"
            />
            {timeline}
          </section>
        </div>
      </main>
    </div>
  );
};
