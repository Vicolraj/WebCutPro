import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const getFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  // Load FFmpeg with WASM files
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

export const extractThumbnail = async (file: File, time: number = 1): Promise<string> => {
  const instance = await getFFmpeg();
  const name = 'input_' + Math.random().toString(36).slice(2, 9);
  const ext = file.name.split('.').pop();
  const inputName = `${name}.${ext}`;
  const outputName = `${name}.jpg`;

  await instance.writeFile(inputName, await fetchFile(file));
  
  // Execute FFmpeg command to extract 1 frame at 'time' seconds
  await instance.exec([
    '-ss', time.toString(),
    '-i', inputName,
    '-frames:v', '1',
    '-q:v', '2',
    outputName
  ]);

  const data = await instance.readFile(outputName);
  const blob = new Blob([data as any], { type: 'image/jpeg' });
  const url = URL.createObjectURL(blob);

  // Cleanup
  await instance.deleteFile(inputName);
  await instance.deleteFile(outputName);

  return url;
};
