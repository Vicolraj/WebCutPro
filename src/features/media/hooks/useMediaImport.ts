import { useState } from 'react';
import { db, type MediaAsset } from '../../../libs/db';
import { extractThumbnail } from '../../../core/engine/ffmpeg';


export const useMediaImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const importFiles = async (files: FileList | null) => {
    if (!files) return;
    setIsImporting(true);
    setProgress(0);

    const total = files.length;
    let count = 0;

    for (let i = 0; i < total; i++) {
       const file = files[i];
       const id = Math.random().toString(36).substring(2, 9);
       
       let thumbnail: string | undefined;
       let duration: number | undefined;

       // Extract thumbnail for videos
       if (file.type.startsWith('video/')) {
          try {
             thumbnail = await extractThumbnail(file);
             // Duration detection (basic)
             const video = document.createElement('video');
             video.src = URL.createObjectURL(file);
             await new Promise((resolve) => video.onloadedmetadata = resolve);
             duration = video.duration;
             URL.revokeObjectURL(video.src);
          } catch (e) {
             console.error('Thumbnail extraction failed', e);
          }
       } else if (file.type.startsWith('image/')) {
          thumbnail = URL.createObjectURL(file);
       }

       const asset: MediaAsset = {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          blob: file,
          thumbnail,
          duration
       };

       await db.assets.add(asset);
       count++;
       setProgress((count / total) * 100);
    }

    setIsImporting(false);
  };

  return { importFiles, isImporting, progress };
};
