import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export class RenderEngine {

  private ffmpeg: FFmpeg;
  private isLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load() {
    if (this.isLoaded) return;
    
    // Load FFmpeg from CDN
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    this.isLoaded = true;
  }

  async render(
    canvas: HTMLCanvasElement, 
    duration: number, 
    fps: number, 
    onProgress: (p: number) => void
  ) {
    await this.load();
    
    const totalFrames = Math.ceil(duration * fps);
    
    // Setup FFmpeg
    // We'll write frames as frame-001.png, frame-002.png...
    
    for (let i = 0; i < totalFrames; i++) {
       // 2. Capture canvas
       const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/png'));
       const fileName = `frame-${String(i).padStart(5, '0')}.png`;
       await this.ffmpeg.writeFile(fileName, await fetchFile(blob));
       
       onProgress((i / totalFrames) * 0.8); // 80% for frame capturing
    }

    // 3. Combine frames into video
    await this.ffmpeg.exec([
      '-framerate', String(fps),
      '-i', 'frame-%05d.png',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      'output.mp4'
    ]);

    onProgress(0.95);

    // 4. Read the file
    const data = await this.ffmpeg.readFile('output.mp4');
    onProgress(1.0);
    
    // Convert to Blob. FFmpeg.wasm returns Uint8Array which might be backed by SharedArrayBuffer
    return new Blob([data as any], { type: 'video/mp4' });
  }
}





export const renderEngine = new RenderEngine();
