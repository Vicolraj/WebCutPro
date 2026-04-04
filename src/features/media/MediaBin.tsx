import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  Grid, 
  List, 
  Film
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useUIStore, useProjectStore, usePlaybackStore } from '../../core/store/useStore';
import { db, type MediaAsset } from '../../libs/db';
import { useMediaImport } from './hooks/useMediaImport';
import { cn } from '../../utils/utils';

export const MediaBin: React.FC = () => {
  const { activeTab, setActiveTab } = useUIStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importFiles, isImporting, progress } = useMediaImport();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const { addClip } = useProjectStore();

  useEffect(() => {
    const loadAssets = async () => {
      const allAssets = await db.assets.toArray();
      setAssets(allAssets);
    };
    loadAssets();
    
    // Refresh when importing finishes
    if (!isImporting) loadAssets();
  }, [isImporting]);

  const handleFileUpload = (files: FileList | null) => {
    importFiles(files);
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Header Tabs */}
      <div className="flex items-center gap-1 border-b border-border px-2">
        {['media', 'effects', 'text', 'audio', 'stickers'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition-all
              ${activeTab === tab ? 'text-accent border-b-2 border-accent' : 'text-textSec hover:text-text'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'media' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between p-2 gap-2">
            <div className="flex flex-1 items-center bg-surface border border-border rounded-px6 px-2 py-1">
              <Search size={14} className="text-textDim mr-2" />
              <input
                type="text"
                placeholder="Search assets..."
                className="bg-transparent border-none outline-none text-xs w-full text-text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
               <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} active={viewMode === 'grid'}>
                  <Grid size={14} />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} active={viewMode === 'list'}>
                  <List size={14} />
               </Button>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); handleFileUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`
              mx-3 mb-4 p-6 border-2 border-dashed rounded-px10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all
              ${isDraggingOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent hover:bg-white/5'}
            `}
          >
            <Upload size={24} className={isDraggingOver ? 'text-accent' : 'text-textDim'} />
            <div className="text-center">
              <p className="text-xs font-semibold text-text">Import Media</p>
              <p className="text-[10px] text-textDim italic">Drop files or click</p>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => handleFileUpload(e.target.files)} 
            />
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {isImporting && (
               <div className="mb-4 bg-surface rounded-px6 p-3 border border-accent/20">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] uppercase font-bold text-accent">Importing...</span>
                     <span className="text-[10px] font-mono">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                     <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
               </div>
            )}
            
            {assets.length === 0 && !isImporting ? (
               <div className="flex flex-col items-center justify-center gap-4 py-20 text-textDim opacity-50">
                  <Film size={48} strokeWidth={1} />
                  <p className="text-xs font-medium">Empty Media Bin</p>
               </div>
            ) : (
                <div 
                  className={cn(
                    "grid gap-3",
                    viewMode === 'grid' ? "grid-cols-2" : "flex flex-col"
                  )}
                >
                   {filteredAssets.map(asset => (
                     <div
                        key={asset.id}
                        onClick={() => {
                          const blobUrl = URL.createObjectURL(asset.blob);
                          const clipType = asset.type.includes('video') ? 'video' : 'audio';
                          
                          addClip({
                            id: Math.random().toString(36).substring(2, 9),
                            trackId: clipType === 'video' ? 'v1' : 'a1',
                            startTime: usePlaybackStore.getState().playhead,
                            duration: asset.duration || 5,
                            sourceStart: 0,
                            name: asset.name,
                            type: clipType,
                            mediaId: asset.id,
                            blob: blobUrl,
                          });
                        }}
                        className={cn(
                          "group relative bg-surface border border-border rounded-xl overflow-hidden cursor-pointer hover:border-accent transition-all hover:scale-[1.02] active:scale-98 shadow-sm",
                          viewMode === 'list' && "flex items-center p-2"
                        )}
                      >
                        <div className={cn(
                          "aspect-video bg-black flex items-center justify-center text-accent/30 overflow-hidden",
                          viewMode === 'list' && "w-12 h-12 aspect-square rounded-lg flex-shrink-0"
                        )}>
                          {asset.thumbnail ? (
                            <img src={asset.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            asset.type.includes('video') ? <Film size={24} /> : <div className="text-xl font-bold italic">A</div>
                          )}
                        </div>
                        <div className="p-2 min-w-0">
                          <p className="text-[11px] font-bold truncate mb-1 text-text">{asset.name}</p>
                          <div className="flex items-center gap-2 text-[9px] text-textDim uppercase font-bold tracking-tighter">
                            <span>{(asset.size / (1024 * 1024)).toFixed(1)} MB</span>
                            {asset.duration && (
                              <>
                                <span>•</span>
                                <span>{Math.floor(asset.duration)}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                   ))}
                </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'text' && (
         <div className="flex-1 p-3 flex flex-col gap-4">
            <h3 className="text-[10px] uppercase font-bold tracking-widest text-accent">Titles & Text</h3>
            <div className="grid grid-cols-2 gap-2">
               <button 
                  onClick={() => {
                     const id = Math.random().toString(36).substring(2, 9);
                     const state = useProjectStore.getState();
                     const track = state.tracks.find(t => t.type === 'video');

                     if (!track) return;

                     addClip({
                        id,
                        trackId: track.id,
                        name: 'New Title',
                        startTime: usePlaybackStore.getState().playhead,
                        duration: 5,
                        sourceStart: 0,
                        type: 'text',
                        blob: '', // Text clips don't need a blob
                        isSelected: true,
                        content: 'Enter Text',
                        style: {
                          fontSize: 48,
                          fontFamily: 'Inter',
                          color: '#ffffff',
                          x: 960,
                          y: 540
                        }
                     });
                  }}
                  className="flex flex-col items-center justify-center aspect-square bg-surface border border-border rounded-px8 hover:border-accent hover:bg-accent/5 transition-all group"
               >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                     <span className="text-accent font-black text-xl italic leading-none">T</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-textDim group-hover:text-text">Add Title</span>
               </button>
            </div>
         </div>
      )}

      {['effects', 'audio', 'stickers'].includes(activeTab) && (
         <div className="flex-1 flex flex-col items-center justify-center text-textDim gap-4 opacity-50">
            <p className="text-xs font-semibold uppercase tracking-widest">{activeTab} Coming Soon</p>
         </div>
      )}
    </div>
  );
};
