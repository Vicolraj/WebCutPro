import Dexie, { type Table } from 'dexie';

export interface MediaAsset {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  blob: Blob;
  thumbnail?: string;
  duration?: number;
}

export interface ProjectData {
  id: string;
  name: string;
  tracks: any[];
  clips: any[];
  transitions?: any[];
  lastSaved: number;
}


export class WebCutDB extends Dexie {
  assets!: Table<MediaAsset>;
  projects!: Table<ProjectData>;

  constructor() {
    super('WebCutProDB');
    this.version(1).stores({
      assets: 'id, name, type',
      projects: 'id, name, lastSaved'
    });
  }
}

export const db = new WebCutDB();
