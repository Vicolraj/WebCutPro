import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, Trash2, Clock, Play } from 'lucide-react';
import { db, type ProjectData } from '../../libs/db';
import { useProjectStore } from '../../core/store/useStore';


export const ProjectDashboard: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const { loadProjectData } = useProjectStore();

  useEffect(() => {
    const fetchProjects = async () => {
      const allProjects = await db.projects.toArray();
      setProjects(allProjects.sort((a, b) => b.lastSaved - a.lastSaved));
    };
    fetchProjects();
  }, []);

  const handleCreateNew = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    loadProjectData({
      projectId: newId,
      projectName: 'New Project',
      tracks: [
        { id: 'v1', type: 'video', name: 'Video 1', isMuted: false, isLocked: false, isSolo: false },
        { id: 'v2', type: 'video', name: 'Video 2', isMuted: false, isLocked: false, isSolo: false },
        { id: 'a1', type: 'audio', name: 'Audio 1', isMuted: false, isLocked: false, isSolo: false },
      ],
      clips: [],
      transitions: [],
    });
  };

  const handleLoad = (project: ProjectData) => {
    loadProjectData({
      projectId: project.id,
      projectName: project.name,
      tracks: project.tracks,
      clips: project.clips,
      transitions: project.transitions || [],
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this project? This action cannot be undone.')) {
      await db.projects.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background text-text p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-accent/60 bg-clip-text text-transparent">
              WebCut Pro
            </h1>
            <p className="text-textDim mt-2">Your creative studio in the browser</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg hover:shadow-accent/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleLoad(project)}
                className="group relative bg-surface border border-border/40 hover:border-accent/40 rounded-2xl p-6 cursor-pointer transition-all hover:bg-surfaceLight shadow-sm hover:shadow-xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                    <Folder className="w-6 h-6 text-accent" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="p-2 text-textDim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                  {project.name}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-textDim">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(project.lastSaved).toLocaleDateString()}
                  </div>
                  <span>•</span>
                  <div>{project.clips.length} clips</div>
                </div>

                <div className="mt-6 flex items-center justify-end">
                  <div className="text-accent flex items-center gap-1 font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    Open Project
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {projects.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-textDim border-2 border-dashed border-border/40 rounded-3xl">
              <Folder className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">No projects yet. Create your first masterpiece!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
