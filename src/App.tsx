import React, { useEffect } from 'react';
import { EditorLayout } from './components/layout/EditorLayout';
import { TopBar } from './features/topbar/TopBar';
import { MediaBin } from './features/media/MediaBin';
import { Timeline } from './features/timeline/Timeline';
import { PreviewPlayer } from './features/preview/PreviewPlayer';
import { usePlaybackStore, useProjectStore } from './core/store/useStore';
import { audioEngine } from './features/audio/AudioEngine';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProjectPersistence } from './hooks/useProjectPersistence';
import { ProjectDashboard } from './features/dashboard/ProjectDashboard';

export const App: React.FC = () => {
  const { isPlaying, playhead, setPlayhead, duration, setIsPlaying } = usePlaybackStore();
  const { clips, projectId, resetProject } = useProjectStore();
  
  // Track if we are in the editor or dashboard
  const [inEditor, setInEditor] = React.useState(false);

  const handleBack = () => {
    resetProject();
    setInEditor(false);
  };

  // Register global hooks
  useKeyboardShortcuts();
  useProjectPersistence();  // Sync inEditor state with projectId
  useEffect(() => {
    if (projectId && projectId !== 'default-project') {
      setInEditor(true);
    }
  }, [projectId]);

  // Initialize and Sync Audio Engine
  useEffect(() => {
    audioEngine.init().then(() => {
       audioEngine.syncClips(clips);
    });
  }, [clips]);

  // Sync isPlaying state
  useEffect(() => {
    if (isPlaying) {
       audioEngine.play();
    } else {
       audioEngine.pause();
    }
  }, [isPlaying]);

  // Sync playhead (seeking)
  useEffect(() => {
    if (!isPlaying) {
      audioEngine.seek(playhead);
    }
  }, [playhead, isPlaying]);

  // Playback Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (isPlaying) {
        const deltaTime = (currentTime - lastTime) / 1000;
        const newPlayhead = playhead + deltaTime;
        
        if (newPlayhead >= duration) {
           setPlayhead(duration);
           setIsPlaying(false);
           audioEngine.stop();
        } else {
           setPlayhead(newPlayhead);
        }
      }
      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playhead, duration, setPlayhead, setIsPlaying]);


  if (!inEditor) {
    return <ProjectDashboard />;
  }

  return (
    <EditorLayout
      topbar={<TopBar onBack={handleBack} />}
      leftPanel={<MediaBin />}
      preview={<PreviewPlayer />}
      rightPanel={
        <div className="flex-1 flex flex-col p-4 gap-6 overflow-y-auto">
          <div className="flex flex-col gap-2">
             <h3 className="text-xs font-bold text-textSec uppercase tracking-widest">Properties</h3>
             <div className="flex flex-col gap-4 py-8 items-center text-center text-textDim italic">
                <p className="text-[10px]">Select a clip to view properties</p>
             </div>
          </div>
          
          <div className="h-px bg-border" />
          
          <div className="flex flex-col gap-2">
             <h3 className="text-xs font-bold text-textSec uppercase tracking-widest">Effects</h3>
             <div className="flex flex-col gap-4 py-8 items-center text-center text-textDim italic">
                <p className="text-[10px]">No active effects</p>
             </div>
          </div>
        </div>
      }
      timeline={<Timeline />}
    />
  );
};


export default App;
