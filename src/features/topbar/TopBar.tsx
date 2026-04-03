import React, { useState } from 'react';
import { useProjectStore } from '../../core/store/useStore';
import { Button } from '../../components/ui/Button';
import { 
  Undo2, 
  Redo2, 
  Download, 
  Save, 
  User, 
  ChevronDown,
  Monitor
} from 'lucide-react';


import { ExportModal } from '../export/ExportModal';

export const TopBar: React.FC = () => {
  const { projectName, setProjectName } = useProjectStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="h-12 bg-panel border-b border-border flex items-center justify-between px-4 z-50">
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
      
      {/* Left: Logo & Project Name */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-px8 bg-gradient-to-br from-accent to-purple flex items-center justify-center shadow-lg shadow-accent/20">
            <span className="text-white font-black text-sm italic">WC</span>
          </div>
          <span className="font-bold text-sm tracking-tight hidden md:block">
            WebCut <span className="text-accent">Pro</span>
          </span>
        </div>

        <div className="h-6 w-px bg-border mx-2" />

        <div className="flex items-center">
          {isEditing ? (
            <input
              autoFocus
              className="bg-surface border border-accent rounded-px4 px-2 py-0.5 text-sm outline-none w-48 text-center"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium hover:bg-white/5 px-3 py-1 rounded-px4 transition-colors"
            >
              {projectName}
            </button>
          )}
        </div>
      </div>

      {/* Middle: Undo/Redo & Zoom */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" title="Undo (Ctrl+Z)">
          <Undo2 size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="Redo (Ctrl+Y)">
          <Redo2 size={16} />
        </Button>
        <div className="h-4 w-px bg-border mx-2" />
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-textSec">
          <Monitor size={14} />
          100%
          <ChevronDown size={12} />
        </Button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-surface border border-border rounded-px6 p-0.5 mr-2">
           <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 text-textSec">Draft</Button>
           <div className="w-px h-3 bg-border" />
           <Button variant="ghost" size="sm" className="text-accent text-[10px] h-7 px-2">Saved</Button>
        </div>
        
        <Button variant="outline" size="sm" className="gap-2">
          <Save size={14} />
          <span className="hidden sm:inline">Save</span>
        </Button>

        <Button 
          variant="accent" 
          size="sm" 
          className="gap-2 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => setIsExportModalOpen(true)}
        >
          <Download size={14} />
          <span className="font-semibold">Export</span>
        </Button>

        <div className="h-6 w-px bg-border mx-2" />

        <Button variant="ghost" size="icon" className="rounded-full bg-surface">
          <User size={16} />
        </Button>
      </div>
    </div>
  );
};

