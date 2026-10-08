/** “Tidal memories”: 96 seconds of soft, synthesized felt-piano in D minor.
 * Sparse broken chords, a descending answer, and long stereo room tails.
 * Each hammer strike excites partials that decay faster as pitch increases.
 */
export async function renderAquariumPiano(): Promise<AudioBuffer> {
  const rate = 22050;
  const duration = 96;
  const context = new OfflineAudioContext(2, rate * duration, rate);
  const room = context.createConvolver();
  const impulse = context.createBuffer(2, rate * 5, rate);
  let seed = 7183;
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[index] = (seed / 4294967296 * 2 - 1) * Math.exp(-index / rate * 1.5);
    }
  }
  room.buffer = impulse;
  const wet = context.createGain();
  wet.gain.value = 0.28;
  room.connect(wet).connect(context.destination);

  function piano(midi: number, at: number, velocity: number) {
    const panner = context.createStereoPanner();
    panner.pan.value = Math.max(-0.55, Math.min(0.55, (midi - 60) / 40));
    panner.connect(context.destination);
    panner.connect(room);
    [1, 0.38, 0.16, 0.07, 0.03].forEach((weight, index) => {
      const partial = index + 1;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12) * partial * Math.sqrt(1 + 0.00012 * partial ** 2);
      const decay = (midi < 50 ? 9 : 6) / (1 + index * 0.65);
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(velocity * weight, at + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.00001, at + decay);
      envelope.gain.linearRampToValueAtTime(0, at + decay + 0.05);
      oscillator.connect(envelope).connect(panner);
      oscillator.start(at);
      oscillator.stop(at + decay + 0.1);
    });
  }

  const harmony = [[38, 57, 60, 64], [34, 53, 57, 62], [41, 55, 57, 60], [36, 55, 62, 64]];
  const answers = [[76, 72, 69], [74, 69, 65], [72, 69, 67], [69, 64, 62]];
  for (let phrase = 0; phrase < 8; phrase += 1) {
    const at = phrase * 12;
    const chord = harmony[phrase % 4];
    piano(chord[0], at + 0.2, 0.13);
    chord.slice(1).forEach((pitch, index) => piano(pitch, at + 1.7 + index * 1.5, 0.075 - index * 0.009));
    answers[phrase % 4].forEach((pitch, index) => {
      piano(pitch, at + 6.3 + index * 1.65, 0.065 - index * 0.009);
    });
  }
  return context.startRendering();
}
