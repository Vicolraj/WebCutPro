import { useEffect } from 'react';
import { useProjectStore } from '../core/store/useStore';
import { db } from '../libs/db';

export const useProjectPersistence = () => {
  const { projectName, tracks, clips } = useProjectStore();

  // Load project on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const project = await db.projects.toArray();
        if (project.length > 0) {
          const latest = project[0];
          console.log('Loading project:', latest.name);
          // In Phase 3, we will add a bulk loading action to the store
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      }
    };

    loadProject();
  }, []);

  // Save project on changes (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await db.projects.put({
          id: 'default-project',
          name: projectName,
          tracks,
          clips,
          lastSaved: Date.now()
        });
        console.log('Project Saved');
      } catch (err) {
        console.error('Failed to save project:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [projectName, tracks, clips]);
};
