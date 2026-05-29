// Define this at the module scope
let audio: HTMLAudioElement | null = null;

export const playProceduralSong = (isPlaying: boolean, volume = 0.3) => {
  if (typeof window === "undefined") return;

  // Initialize the audio object only once
  if (!audio) {
    audio = new Audio('/Pursuit of Jade Instrumental OST  A Single Thought 一念 by Zhang Zining (张紫宁) and Li Xinyi (李鑫一) 逐玉'); // Path to your file in 'public'
    audio.loop = true; // Essential for background music
    audio.volume = volume;
  }

  if (isPlaying) {
    audio.play().catch(e => console.log("Autoplay blocked:", e));
  } else {
    audio.pause();
  }
};