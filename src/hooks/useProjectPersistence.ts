import { useEffect } from 'react';
import { useProjectStore } from '../core/store/useStore';
import { db } from '../libs/db';

export const useProjectPersistence = () => {
  const { projectId, projectName, tracks, clips, loadProjectData } = useProjectStore();

  // Load project on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projects = await db.projects.toArray();
        if (projects.length > 0) {
          // Find the last edited project or default to the first one
          const latest = projects.sort((a, b) => b.lastSaved - a.lastSaved)[0];
          console.log('Auto-loading project:', latest.name);
          
          // Hydrate clips with fresh Blob URLs
          const hydratedClips = await Promise.all(latest.clips.map(async (clip: any) => {
            if (clip.mediaId && clip.type !== 'text') {
              const asset = await db.assets.get(clip.mediaId);
              if (asset) {
                return { ...clip, blob: URL.createObjectURL(asset.blob) };
              }
            }
            return clip;
          }));

          loadProjectData({
            projectId: latest.id,
            projectName: latest.name,
            tracks: latest.tracks,
            clips: hydratedClips,
            transitions: latest.transitions || []
          });

        }
      } catch (err) {
        console.error('Failed to auto-load project:', err);
      }
    };

    loadProject();
  }, []); // Only on mount

  // Save project on changes (Debounced)
  useEffect(() => {
    // Don't save default empty state if we haven't loaded yet
    if (!projectId) return;

    const timer = setTimeout(async () => {
      try {
        await db.projects.put({
          id: projectId,
          name: projectName,
          tracks,
          clips,
          lastSaved: Date.now()
        });
        console.log('Project Saved:', projectName);
      } catch (err) {
        console.error('Failed to save project:', err);
      }
    }, 2000); // 2s debounce for performance

    return () => clearTimeout(timer);
  }, [projectId, projectName, tracks, clips]);
};

