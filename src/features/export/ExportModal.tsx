import React, { useState } from 'react';
import { usePlaybackStore, useProjectStore } from '../../core/store/useStore';
import { renderEngine } from '../../core/render/RenderEngine';
import { Button } from '../../components/ui/Button';
import { 
  X, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Film
} from 'lucide-react';


export const ExportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { duration } = usePlaybackStore();
  const { projectName } = useProjectStore();
  const [status, setStatus] = useState<'idle' | 'rendering' | 'finished' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRender = async () => {
    try {
      setStatus('rendering');
      setProgress(0);
      
      // 1. Get the main preview canvas
      const canvas = document.querySelector('canvas');
      if (!canvas) throw new Error('Preview canvas not found');

      // 2. Begin rendering loop in the engine
      // We'll pass a closure to update playhead for each frame
      const fps = 30;
      
      const renderBlob = await renderEngine.render(
        canvas, 
        duration, 
        fps, 
        (p) => setProgress(p)
      );


      // 3. Trigger download
      const url = URL.createObjectURL(renderBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName || 'WebCutPro'}.mp4`;
      a.click();
      
      setStatus('finished');
    } catch (e: any) {
      setError(e.message || 'Rendering failed');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-panel border border-border shadow-2xl rounded-px16 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-2">
             <Download size={18} className="text-accent" />
             <h2 className="text-sm font-bold uppercase tracking-widest">Export Project</h2>
          </div>
          <button onClick={onClose} className="text-textDim hover:text-text transition-colors"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          {status === 'idle' && (
            <>
               <div className="flex items-center gap-4 p-4 rounded-px12 bg-surface/30 border border-border/50">
                  <div className="w-12 h-12 rounded-px10 bg-accent/10 flex items-center justify-center text-accent">
                     <Film size={24} />
                  </div>
                  <div>
                     <p className="text-xs font-bold">{projectName}.mp4</p>
                     <p className="text-[10px] text-textDim italic">1920x1080 • {duration.toFixed(1)}s • 30fps</p>
                  </div>
               </div>
               
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-tighter text-textDim ml-1">Resolution</label>
                  <select className="bg-surface border border-border rounded-px8 px-3 py-2 text-xs outline-none focus:border-accent transition-all appearance-none cursor-pointer">
                     <option>Full HD (1080p)</option>
                     <option>HD (720p)</option>
                     <option>Social (1080x1350)</option>
                  </select>
               </div>
               
               <Button variant="accent" size="lg" className="w-full gap-2 mt-2 h-12" onClick={handleRender}>
                  <Download size={18} />
                  Render & Download
               </Button>
            </>
          )}

          {status === 'rendering' && (
            <div className="flex flex-col items-center justify-center py-8 gap-6">
               <div className="relative">
                  <Loader2 size={64} className="text-accent animate-spin opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-xs font-mono font-bold">{Math.round(progress * 100)}%</span>
                  </div>
               </div>
               <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-text">Rendering Video...</p>
                  <p className="text-[10px] text-textDim italic mt-1">This may take a few minutes. Don't close the tab.</p>
               </div>
               <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress * 100}%` }} />
               </div>
            </div>
          )}

          {status === 'finished' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 animate-in slide-in-from-bottom duration-500">
               <div className="w-16 h-16 rounded-full bg-green/20 flex items-center justify-center text-green">
                  <CheckCircle2 size={32} />
               </div>
               <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest">Success!</p>
                  <p className="text-[10px] text-textDim mt-1">Your video has been rendered and downloaded.</p>
               </div>
               <Button variant="outline" className="mt-4 w-full" onClick={onClose}>Close</Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-red">
               <AlertCircle size={32} />
               <p className="text-xs font-bold uppercase tracking-widest">Rendering Error</p>
               <p className="text-[10px] text-center bg-red/10 p-3 rounded-px8 w-full">{error}</p>
               <Button variant="outline" className="mt-4 w-full" onClick={() => setStatus('idle')}>Try Again</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
