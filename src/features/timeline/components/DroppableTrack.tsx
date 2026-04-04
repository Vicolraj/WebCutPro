import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DroppableTrackProps {
  id: string;
  children: React.ReactNode;
}

export const DroppableTrack: React.FC<DroppableTrackProps> = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `track-${id}`,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-1 timeline-track h-[52px] relative transition-colors duration-200",
        isOver ? "bg-accent/10 border-y border-dashed border-accent/40" : "bg-transparent"
      )}
    >
      {children}
    </div>
  );
};
