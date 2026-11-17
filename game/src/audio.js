'use strict';
Tideglass.createAudio = function createAudio() {
  let context, master, muted = false, nextNote = 0, beat = 0;
  function unlock() {
    if (!context) {
      context = new (window.AudioContext || window.webkitAudioContext)();
      master = context.createGain(); master.gain.value = 0.28; master.connect(context.destination);
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  }
  function tone(frequency, duration, type = 'sine', volume = 0.2, delay = 0, slide = 1) {
    if (!context || muted) return;
    const t = context.currentTime + delay, osc = context.createOscillator(), amp = context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, t);
    osc.frequency.exponentialRampToValueAtTime(frequency * slide, t + duration);
    amp.gain.setValueAtTime(0.001, t); amp.gain.exponentialRampToValueAtTime(volume, t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(amp); amp.connect(master); osc.start(t); osc.stop(t + duration + 0.01);
  }
  function play(name, value = 1) {
    if (name === 'cast') tone(180, 0.14, 'sine', 0.15, 0, 2);
    if (name === 'capture') {
      [0, 4, 7, 12].slice(0, Math.min(4, value + 1)).forEach((n, i) => tone(330 * 2 ** (n / 12), 0.4, 'sine', 0.18, i * 0.065));
    }
    if (name === 'empty') tone(160, 0.14, 'triangle', 0.1, 0, 0.75);
    if (name === 'dash') tone(170, 0.23, 'triangle', 0.15, 0, 3);
    if (name === 'hit') { tone(90, 0.35, 'sawtooth', 0.13, 0, 0.3); tone(55, 0.45, 'sine', 0.4); }
    if (name === 'lantern' || name === 'win') {
      [0, 4, 7, 11, 12, 19].forEach((n, i) => tone(262 * 2 ** (n / 12), 1.1, 'sine', 0.16, i * 0.12));
    }
    if (name === 'lose') [220, 196, 147, 110].forEach((f, i) => tone(f, 0.7, 'triangle', 0.17, i * 0.15));
  }
  function update(active, phase) {
    if (!context || !active || muted) return;
    if (context.currentTime > nextNote) {
      const notes = [0, 7, 12, 16, 7, 14, 12, 19];
      tone(110 * 2 ** (notes[beat % 8] / 12), 1.5, 'sine', 0.055);
      if (beat % 4 === 0) tone(55 * 2 ** (phase / 12), 2.2, 'sine', 0.075);
      nextNote = context.currentTime + 0.48; beat++;
    }
  }
  return { unlock, play, update, get muted() { return muted; }, toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.28; } };
};
