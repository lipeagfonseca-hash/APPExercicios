export function beep(frequency = 880) {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.3);
  oscillator.onended = () => ctx.close();
}
