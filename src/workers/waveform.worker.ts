// Waveform computation worker
self.onmessage = async (e: MessageEvent<{ blob: Blob, points: number }>) => {
  const { blob, points } = e.data;
  
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (self.AudioContext || (self as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / points);
    const waveform = new Float32Array(points);
    
    for (let i = 0; i < points; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      waveform[i] = max;
    }
    
    self.postMessage({ waveform });
    audioCtx.close();
  } catch (err: any) {
    self.postMessage({ error: err?.message || 'Unknown error' });
  }
};
