import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContextMenuOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ContextMenuProps {
  x: number;
  y: number;
  options: ContextMenuOption[];
  onClose: () => void;
  isOpen: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, options, onClose, isOpen }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="fixed z-[9999] min-w-[160px] bg-[#1A1A24] border border-white/10 rounded-px8 shadow-2xl p-1 overflow-hidden"
          style={{ left: x, top: y }}
        >
          {options.map((option, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                option.onClick();
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-[12px] font-medium transition-colors rounded-px4",
                option.variant === 'danger' 
                  ? "text-red-400 hover:bg-red-400/10" 
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              )}
            >
              {option.icon && <span className="opacity-60">{option.icon}</span>}
              {option.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
