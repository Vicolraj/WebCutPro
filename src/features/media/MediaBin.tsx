import React, { useEffect, useState } from 'react';
import { useMediaImport } from './hooks/useMediaImport';
import { db, type MediaAsset } from '../../libs/db';
import { 
  FileVideo, 
  FileAudio, 
  FileImage, 
  FileText, 
  Plus, 
  Upload,
  Trash2,
  Search
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { usePlaybackStore, useProjectStore } from '../../core/store/useStore';
import { ContextMenu } from '../../components/ui/ContextMenu';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DraggableAssetProps {
  asset: MediaAsset;
  onContextMenu: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const DraggableAsset: React.FC<DraggableAssetProps> = ({ asset, onContextMenu, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: asset.id,
    data: asset
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative bg-[#16161E] border border-white/5 rounded-px8 overflow-hidden hover:border-accent/30 transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 border-accent z-50 pointer-events-none"
      )}
      onContextMenu={onContextMenu}
      onClick={onClick}
    >
      {/* Thumbnail / Icon Container */}
      <div className="h-24 bg-black/40 flex items-center justify-center relative overflow-hidden group-hover:bg-black/20 transition-colors">
        {asset.thumbnail ? (
          <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
        ) : (
          <div className="opacity-20 text-accent">
            {asset.type.includes('video') ? <FileVideo size={32} /> : 
             asset.type.includes('audio') ? <FileAudio size={32} /> : 
             asset.type.includes('image') ? <FileImage size={32} /> : 
             <FileText size={32} />}
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto rounded-full bg-white/10 hover:bg-accent/40 text-white pointer-events-auto">
            <Plus size={12} />
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-2 border-t border-white/5 bg-[#1C1C24]/50">
        <div className="text-[10px] font-bold text-white/90 truncate leading-tight mb-1">{asset.name}</div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-textDim uppercase tracking-widest font-mono">
            {asset.type.split('/')[1] || 'FILE'}
          </span>
          <span className="text-[9px] text-textDim">
            {(asset.size / 1024 / 1024).toFixed(1)} MB
          </span>
        </div>
      </div>
    </div>
  );
};

export const MediaBin: React.FC = () => {
  const { importFiles, isImporting, progress } = useMediaImport();
  const { addClip, deleteAsset } = useProjectStore();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, assetId: string } | null>(null);

  const fetchAssets = async () => {
    const allAssets = await db.assets.toArray();
    setAssets(allAssets);
  };

  useEffect(() => {
    fetchAssets();
  }, [isImporting]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    importFiles(e.target.files);
  };

  const handleDeleteAsset = async (id: string) => {
    await db.assets.delete(id);
    deleteAsset(id);
    fetchAssets();
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-panel select-none">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-textDim flex items-center gap-2">
          Media Assets
          <span className="bg-white/5 px-1.5 py-0.5 rounded-px4 text-[9px] text-accent">
            {assets.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
           <label className="cursor-pointer">
              <input type="file" multiple className="hidden" onChange={handleImport} />
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-white/5 hover:bg-accent/20 hover:text-accent border border-white/5">
                <Upload size={14} />
              </Button>
           </label>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 pt-3">
        <div className="relative group">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-textDim group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search project..."
            className="w-full bg-black/40 border border-white/5 rounded-px6 py-1.5 pl-8 pr-3 text-[11px] text-white focus:outline-none focus:border-accent/40 focus:bg-black/60 transition-all placeholder:text-textDim/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {isImporting && (
          <div className="mb-4 bg-accent/5 border border-accent/20 rounded-px8 p-3 animate-pulse">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-bold text-accent uppercase tracking-thicker">Importing...</span>
               <span className="text-[10px] text-accent/60 italic">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div 
                  className="h-full bg-accent transition-all duration-300 shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" 
                  style={{ width: `${progress}%` }} 
               />
            </div>
          </div>
        )}

        {filteredAssets.length === 0 && !isImporting ? (
          <div className="h-40 flex flex-col items-center justify-center text-center opacity-30">
            <div className="p-4 rounded-full bg-white/5 mb-3">
              <Upload size={24} />
            </div>
            <p className="text-[11px] font-medium max-w-[140px]">Drag files here or use the upload button</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => (
              <DraggableAsset 
                key={asset.id} 
                asset={asset}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, assetId: asset.id });
                }}
                onClick={() => {
                  const blobUrl = URL.createObjectURL(asset.blob);
                  let clipType: 'video' | 'audio' | 'image' | 'text' = 'video';
                  
                  if (asset.type.includes('video')) {
                    clipType = 'video';
                  } else if (asset.type.includes('audio')) {
                    clipType = 'audio';
                  } else if (asset.type.includes('image')) {
                    clipType = 'image';
                  }

                  const trackId = (clipType === 'video' || clipType === 'image') ? 'v1' : 'a1';
                  
                  addClip({
                    id: Math.random().toString(36).substring(2, 9),
                    trackId,
                    startTime: usePlaybackStore.getState().playhead,
                    duration: clipType === 'image' ? 5 : (asset.duration || 5),
                    sourceStart: 0,
                    name: asset.name,
                    type: clipType,
                    mediaId: asset.id,
                    blob: blobUrl,
                    thumbnail: asset.thumbnail
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <ContextMenu 
        isOpen={!!contextMenu}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        onClose={() => setContextMenu(null)}
        options={[
          { 
            label: 'Delete Asset', 
            icon: <Trash2 size={14} />, 
            variant: 'danger',
            onClick: () => contextMenu && handleDeleteAsset(contextMenu.assetId)
          }
        ]}
      />
    </div>
  );
};
