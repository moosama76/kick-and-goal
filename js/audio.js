class ChipAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.step = 0;
    this.next = 0;
    this.musicVolume = 1;
    this.effectsVolume = 1;
    try {
      const saved = JSON.parse(localStorage.getItem('kickGoalAudio') || '{}');
      for (const key of ['musicVolume', 'effectsVolume'])
        if (Number.isFinite(saved[key])) this[key] = Math.max(0, Math.min(1, saved[key]));
    } catch {}
  }
  setVolume(channel, value) {
    if (channel !== 'music' && channel !== 'effects') return;
    const volume = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    this[channel + 'Volume'] = volume;
    if (this.ctx)
      this[channel].gain.setTargetAtTime(
        volume * (channel === 'music' ? 0.2 : 0.38),
        this.ctx.currentTime,
        0.015
      );
    try {
      localStorage.setItem(
        'kickGoalAudio',
        JSON.stringify({ musicVolume: this.musicVolume, effectsVolume: this.effectsVolume })
      );
    } catch {}
  }
  start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createGain();
      this.music = c.createGain();
      this.effects = c.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.music.gain.value = 0.2 * this.musicVolume;
      this.effects.gain.value = 0.38 * this.effectsVolume;
      this.music.connect(this.master);
      this.effects.connect(this.master);
      this.master.connect(c.destination);
      const buffer = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
      this.next = c.currentTime + 0.06;
      this.timer = setInterval(() => this.schedule(), 50);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.next < this.ctx.currentTime - 0.2) this.next = this.ctx.currentTime + 0.05;
  }
  note(midi, time, dur = 0.1, type = 'square', vol = 0.045, out) {
    if (!midi) return;
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain(),
      f = 440 * 2 ** ((midi - 69) / 12);
    o.type = type;
    o.frequency.setValueAtTime(f, time);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.006);
    g.gain.setValueAtTime(vol, time + dur * 0.55);
    g.gain.linearRampToValueAtTime(0.0001, time + dur);
    o.connect(g);
    g.connect(out || this.music);
    o.start(time);
    o.stop(time + dur + 0.02);
  }
  noise(time, dur = 0.05, vol = 0.04, out, highpass = true) {
    const c = this.ctx,
      src = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      g = c.createGain();
    src.buffer = this.noiseBuffer;
    filter.type = highpass ? 'highpass' : 'lowpass';
    filter.frequency.value = highpass ? 4500 : 700;
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(out || this.music);
    src.start(time);
    src.stop(time + dur);
  }
  schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const beat = 60 / 132 / 4,
      lead = [
        69, 0, 72, 76, 74, 0, 72, 69, 67, 0, 71, 74, 76, 0, 74, 71, 69, 0, 72, 76, 79, 76, 74, 72,
        67, 0, 71, 74, 72, 69, 67, 0
      ],
      bass = [45, 45, 41, 41, 43, 43, 40, 40];
    while (this.next < c.currentTime + 0.12) {
      const s = this.step % 32,
        t = this.next;
      this.note(lead[s], t, beat * 0.82, 'square', 0.038);
      if (s % 2 === 0) this.noise(t, 0.035, s % 4 === 0 ? 0.035 : 0.018);
      if (s % 4 === 0) {
        this.note(bass[(s / 4) % 8], t, beat * 3.2, 'triangle', 0.12);
        this.noise(t, 0.09, 0.055, undefined, false);
      }
      if (s % 8 === 6) this.note(lead[s] + 12, t, beat * 1.5, 'square', 0.018);
      this.next += beat;
      this.step++;
    }
  }
  sweep(from, to, dur, type = 'square', vol = 0.16, delay = 0) {
    if (!this.ctx) return;
    const c = this.ctx,
      t = c.currentTime + delay,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.effects);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  sfx(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    if (name === 'kick') {
      this.sweep(210, 65, 0.13, 'square', 0.2);
      this.noise(t, 0.06, 0.1, this.effects, false);
    } else if (name === 'talk') {
      const notes = [62, 65, 64, 69, 67, 64],
        index = this.talkStep || 0;
      this.talkStep = index + 1;
      this.note(notes[index % notes.length], t, 0.075, 'square', 0.14, this.effects);
    } else if (name === 'jump') this.sweep(240, 480, 0.1, 'square', 0.09);
    else if (name === 'bounce') {
      this.sweep(170, 650, 0.18, 'square', 0.15);
      this.sweep(340, 900, 0.12, 'triangle', 0.12, 0.06);
    } else if (name === 'recall') this.sweep(420, 760, 0.08, 'triangle', 0.08);
    else if (name === 'switch')
      [72, 76, 79].forEach((n, i) =>
        this.note(n, t + i * 0.055, 0.09, 'square', 0.13, this.effects)
      );
    else if (name === 'hurt') {
      this.sweep(150, 48, 0.22, 'sawtooth', 0.16);
      this.noise(t, 0.12, 0.1, this.effects, false);
    } else if (name === 'break') {
      this.noise(t, 0.18, 0.18, this.effects, false);
      this.sweep(180, 55, 0.16, 'square', 0.13);
    } else if (name === 'goal')
      [72, 76, 79, 84].forEach((n, i) =>
        this.note(n, t + i * 0.1, 0.18, 'square', 0.16, this.effects)
      );
    else if (name === 'land') this.noise(t, 0.045, 0.035, this.effects, false);
    else if (name === 'select') this.sweep(420, 620, 0.06, 'square', 0.07);
    else if (name === 'teleport') {
      this.sweep(110, 1400, 0.2, 'sine', 0.16);
      this.sweep(1500, 180, 0.24, 'square', 0.1, 0.07);
    } else if (name === 'trapped') {
      this.sweep(460, 170, 0.13, 'square', 0.12);
      this.sweep(300, 90, 0.16, 'triangle', 0.12, 0.14);
      this.noise(t, 0.07, 0.045, this.effects, false);
    } else if (name === 'deny') this.sweep(180, 120, 0.1, 'square', 0.09);
    else if (name === 'gloveLaunch') {
      this.sweep(140, 520, 0.12, 'sawtooth', 0.13);
      this.noise(t, 0.06, 0.07, this.effects, false);
    } else if (name === 'gloveHit') {
      this.sweep(100, 42, 0.16, 'square', 0.22);
      this.noise(t, 0.12, 0.16, this.effects, false);
      this.sweep(700, 260, 0.08, 'triangle', 0.1, 0.03);
    } else if (name === 'gloveReturn') this.sweep(500, 260, 0.1, 'triangle', 0.08);
    else if (name === 'waveClear')
      [72, 76, 79].forEach((n, i) =>
        this.note(n, t + i * 0.07, 0.12, 'triangle', 0.12, this.effects)
      );
    else if (name === 'waveStart') {
      [50, 57, 64, 69].forEach((n, i) =>
        this.note(n, t + i * 0.045, 0.09, 'square', 0.1, this.effects)
      );
      this.noise(t, 0.1, 0.05, this.effects, false);
    } else if (name === 'unlock')
      [60, 64, 67, 72, 76, 79].forEach((n, i) =>
        this.note(n, t + i * 0.065, 0.16, 'square', 0.13, this.effects)
      );
  }
  toggle() {
    this.muted = !this.muted;
    if (this.master)
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime, 0.02);
    return this.muted;
  }
}
const audio = new ChipAudio();
