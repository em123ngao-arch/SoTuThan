// SoundManager.js - Synthesizes game-like, funny sound effects using the Web Audio API
// This makes the app self-contained, lightweight, and works instantly without external assets.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Coin drop: two quick high-frequency sine waves
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.25); // E6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.1);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
  }

  playAlarm() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Siren alarm: pitch wobbling up and down
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.2);
    osc.frequency.linearRampToValueAtTime(300, now + 0.4);
    osc.frequency.linearRampToValueAtTime(600, now + 0.6);
    osc.frequency.linearRampToValueAtTime(300, now + 0.8);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  playSad() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Sad sound: sliding pitch downwards with vibrating amplitude
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(261.63, now); // C4
    osc.frequency.linearRampToValueAtTime(130.81, now + 0.6); // C3

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Ta-da! Ascending arpeggio with bright sound
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const duration = 0.12;

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + duration);
    });
  }

  playKeyboard() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Quick typing click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200 + Math.random() * 400, now);
    
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const sound = new SoundManager();
