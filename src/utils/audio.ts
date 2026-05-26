// Define these at the module scope
let audioCtx: AudioContext | null = null;
let chimeInterval: NodeJS.Timeout | null = null;

export const playProceduralSong = (isPlaying: boolean, volume = 0.3) => {
  // Check if we are in the browser (Prevents server-side crashes)
  if (typeof window === "undefined") return;

  if (!isPlaying) {
    if (chimeInterval) clearInterval(chimeInterval);
    return;
  }

  // Initialize context only once
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const chords = [
    [261.63, 329.63, 392.00, 523.25], 
    [293.66, 349.23, 440.00, 587.33], 
    [329.63, 392.00, 493.88, 659.25], 
    [349.23, 440.00, 523.25, 698.46]  
  ];

  let chordIndex = 0;
  
  const playChime = () => {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const chord = chords[chordIndex];
    const freq = chord[Math.floor(Math.random() * chord.length)];
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 3.0);
    
    if (Math.random() > 0.7) {
      chordIndex = (chordIndex + 1) % chords.length;
    }
  };

  chimeInterval = setInterval(playChime, 800);
};