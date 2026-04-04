import { useState, useEffect } from 'react';
import { db } from '../../../libs/db';

export const useWaveform = (mediaId: string | undefined, points: number = 100) => {
  const [waveform, setWaveform] = useState<Float32Array | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mediaId) return;

    let isMounted = true;
    const worker = new Worker(new URL('../../../workers/waveform.worker.ts', import.meta.url), {
      type: 'module'
    });

    const generate = async () => {
      setIsLoading(true);
      try {
        const asset = await db.assets.get(mediaId);
        if (!asset || !isMounted) return;

        worker.postMessage({ blob: asset.blob, points });
        
        worker.onmessage = (e) => {
          if (isMounted) {
            if (e.data.waveform) {
              setWaveform(e.data.waveform);
            }
            setIsLoading(false);
          }
          worker.terminate();
        };

        worker.onerror = (err) => {
           console.error('Waveform Worker Error:', err);
           setIsLoading(false);
           worker.terminate();
        };

      } catch (err) {
        console.error('Waveform Generation Failed:', err);
        if (isMounted) setIsLoading(false);
        worker.terminate();
      }
    };

    generate();

    return () => {
      isMounted = false;
      worker.terminate();
    };
  }, [mediaId, points]);

  return { waveform, isLoading };
};
