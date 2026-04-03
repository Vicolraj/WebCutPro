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
    // 1. Cleanup old players
    const currentIds = new Set(clips.map(c => c.id));
    for (const [id, player] of this.players.entries()) {
      if (!currentIds.has(id)) {
        player.dispose();
        this.players.delete(id);
      }
    }

    // 2. Create new players for audio clips
    for (const clip of clips) {
      if (clip.type !== 'audio' && clip.type !== 'video') continue;
      if (this.players.has(clip.id)) continue;

      try {
        const asset = await db.assets.get(clip.mediaId);
        if (!asset) continue;

        const url = URL.createObjectURL(asset.blob);
        const player = new Tone.Player(url).toDestination();
        player.sync().start(clip.startTime, clip.sourceStart, clip.duration);
        this.players.set(clip.id, player);
      } catch (e) {
        console.error('Failed to load audio for clip', clip.id, e);
      }
    }
  }

  play() {
    Tone.Transport.start();
  }

  pause() {
    Tone.Transport.pause();
  }

  stop() {
    Tone.Transport.stop();
  }

  seek(seconds: number) {
    Tone.Transport.seconds = seconds;
  }
}

export const audioEngine = new AudioEngine();
