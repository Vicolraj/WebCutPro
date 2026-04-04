import * as Tone from 'tone';
import type { TimelineClip } from '../../core/store/useStore';
import { db } from '../../libs/db';

class AudioEngine {
  private players: Map<string, Tone.Player> = new Map();
  private initialized = false;

  async init() {
    if (this.initialized) return;
    await Tone.start();
    this.initialized = true;
    console.log('Audio Engine Initialized');
  }

  async syncClips(clips: TimelineClip[]) {
    const activeClips = clips.filter(c => c.type === 'audio' || c.type === 'video');
    const currentIds = new Set(activeClips.map(c => c.id));

    // 1. Cleanup old players
    for (const [id, player] of this.players.entries()) {
      if (!currentIds.has(id)) {
        player.unsync();
        player.dispose();
        this.players.delete(id);
      }
    }

    // 2. Create/Update players
    for (const clip of activeClips) {
      if (this.players.has(clip.id)) {
        // Just update sync position if already exists
        const player = this.players.get(clip.id)!;
        player.unsync().sync().start(clip.startTime, clip.sourceStart, clip.duration);
        continue;
      }

      if (!clip.mediaId) continue;

      try {
        const asset = await db.assets.get(clip.mediaId);
        if (!asset) continue;

        const url = URL.createObjectURL(asset.blob);
        const player = new Tone.Player(url).toDestination();
        
        // Wait for buffer to load before syncing
        await new Promise((resolve) => {
          player.buffer.onload = resolve;
        });

        player.sync().start(clip.startTime, clip.sourceStart, clip.duration);
        this.players.set(clip.id, player);
      } catch (e) {
        console.error('Failed to load audio for clip', clip.id, e);
      }
    }
  }

  play() {
    if (!this.initialized) this.init();
    Tone.getTransport().start();
  }

  pause() {
    Tone.getTransport().pause();
  }

  stop() {
    Tone.getTransport().stop();
  }

  seek(seconds: number) {
    Tone.getTransport().seconds = seconds;
  }
}

export const audioEngine = new AudioEngine();
