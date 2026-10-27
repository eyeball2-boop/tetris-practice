/**
 * Pure Web Audio API Sound Synthesizer for Arcade Retro Tetris
 * Works 100% offline, zero network dependencies, zero asset 404s.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicMuted: boolean = false;
  private volume: number = 0.4;
  private musicVolume: number = 0.25;
  private bgmPlaying: boolean = false;
  private bgmTimeout: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    // Read persisted settings
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('tetris_sfx_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';

      const savedBgm = localStorage.getItem('tetris_bgm_muted');
      if (savedBgm !== null) this.musicMuted = savedBgm === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSfxMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('tetris_sfx_muted', String(muted));
  }

  public getSfxMuted(): boolean {
    return this.isMuted;
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    localStorage.setItem('tetris_bgm_muted', String(muted));
    if (muted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public getMusicMuted(): boolean {
    return this.musicMuted;
  }

  // Play a simple frequency envelope
  private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.3, slideTo?: number) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(gainVal * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // AudioContext policy suppression
    }
  }

  // SFX: Move piece left/right
  public playMove() {
    this.playTone(320, 'triangle', 0.04, 0.2, 280);
  }

  // SFX: Rotate piece
  public playRotate() {
    this.playTone(480, 'square', 0.05, 0.18, 640);
  }

  // SFX: Soft drop
  public playDrop() {
    this.playTone(180, 'sine', 0.03, 0.15, 120);
  }

  // SFX: Hard drop (Punchy slam)
  public playHardDrop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.4 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  // SFX: Hold piece
  public playHold() {
    this.playTone(520, 'sine', 0.08, 0.25, 420);
  }

  // SFX: Line clear (1 to 3 lines)
  public playLineClear(lines: number) {
    if (this.isMuted) return;
    const notes = [
      [523.25, 659.25], // Single
      [523.25, 659.25, 783.99], // Double
      [523.25, 659.25, 783.99, 1046.5], // Triple
    ];
    const sequence = notes[Math.min(lines, 3) - 1] || notes[0];

    sequence.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'square', 0.12, 0.25);
      }, idx * 60);
    });
  }

  // SFX: Tetris 4-Line Clear (Exciting arpeggio fanfare)
  public playTetrisClear() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.35);
      }, idx * 70);
    });
  }

  // SFX: Level Up
  public playLevelUp() {
    if (this.isMuted) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'square', 0.18, 0.3);
      }, idx * 90);
    });
  }

  // SFX: Game Over
  public playGameOver() {
    if (this.isMuted) return;
    const notes = [440, 415.3, 392, 349.23, 329.63, 293.66, 261.63];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.22, 0.3);
      }, idx * 110);
    });
  }

  // Retro 8-bit Background Music (Korobeiniki melody line synthesized)
  public startMusic() {
    if (this.musicMuted || this.bgmPlaying) return;
    this.initCtx();
    this.bgmPlaying = true;
    this.bgmStep = 0;
    this.scheduleBgmTick();
  }

  public stopMusic() {
    this.bgmPlaying = false;
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
  }

  private scheduleBgmTick() {
    if (!this.bgmPlaying || this.musicMuted) return;

    // Classic Russian Korobeiniki theme melody sequence in Hertz & duration units
    // [noteFreq, durationInSixteenths]
    const E5 = 659.25, B4 = 493.88, C5 = 523.25, D5 = 587.33, A4 = 440, G4 = 392;
    const F4 = 349.23, E4 = 329.63, GS4 = 415.3;

    const melody: [number, number][] = [
      [E5, 4], [B4, 2], [C5, 2], [D5, 4], [C5, 2], [B4, 2],
      [A4, 4], [A4, 2], [C5, 2], [E5, 4], [D5, 2], [C5, 2],
      [B4, 6], [C5, 2], [D5, 4], [E5, 4],
      [C5, 4], [A4, 4], [A4, 8],

      [D5, 4], [F4 * 2, 2], [A4 * 2, 4], [G4 * 2, 2], [F4 * 2, 2],
      [E5, 6], [C5, 2], [E5, 4], [D5, 2], [C5, 2],
      [B4, 4], [B4, 2], [C5, 2], [D5, 4], [E5, 4],
      [C5, 4], [A4, 4], [A4, 8],
    ];

    const sixteenthMs = 120; // Tempo
    const current = melody[this.bgmStep % melody.length];
    const [freq, sixteenths] = current;

    if (freq > 0 && !this.musicMuted) {
      try {
        this.initCtx();
        if (this.ctx) {
          const osc = this.ctx.createOscillator();
          const bassOsc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          // Sub bass tone for rhythm
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(freq / 2, this.ctx.currentTime);

          const durSec = (sixteenths * sixteenthMs * 0.85) / 1000;
          gain.gain.setValueAtTime(0.08 * this.musicVolume, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + durSec);

          osc.connect(gain);
          bassOsc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start();
          bassOsc.start();
          osc.stop(this.ctx.currentTime + durSec);
          bassOsc.stop(this.ctx.currentTime + durSec);
        }
      } catch (e) {}
    }

    this.bgmStep = (this.bgmStep + 1) % melody.length;
    this.bgmTimeout = window.setTimeout(() => {
      this.scheduleBgmTick();
    }, sixteenths * sixteenthMs);
  }
}

export const sound = new SoundController();
