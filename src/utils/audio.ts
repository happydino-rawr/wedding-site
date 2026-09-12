// Define this at the module scope
export let audio: HTMLAudioElement | null = null;

export const playProceduralSong = (isPlaying: boolean, volume = 0.1) => {
  if (typeof window === "undefined") return;

  // Initialize the audio object only once
  if (!audio) {
    audio = new Audio('/enchanted_sam_yung.mp3'); // Path to your file in 'public'
    audio.loop = true; // Essential for background music
    audio.volume = volume;
  }

  if (isPlaying) {
    audio.play().catch(e => console.log("Autoplay blocked:", e));
  } else {
    audio.pause();
  }
};

export const initAudio = (path: string, volume: number = 0.3) => {
  if (typeof window === "undefined") return null;

  if (!audio) {
    audio = new Audio(path);
    audio.volume = volume;
    audio.loop = true;
  }

  return audio;
};

export const getAudio = (path: string, volume: number = 0.3) => {
  if (typeof window === "undefined") return null;

  if (!audio) {
    audio = new Audio(path);
    audio.volume = volume;
    audio.loop = true;
  }

  return audio;
};