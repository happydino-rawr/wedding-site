import { Volume2, VolumeX } from 'lucide-react';
import { COUPLE_PHOTOS } from '../lib/constants';

// Define the props this component needs from the parent
interface HeroSectionProps {
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onBeginClick: () => void;
}

export default function HeroSection({ isMusicPlaying, onToggleMusic, onBeginClick }: HeroSectionProps) {
  return (
          <section id="hero" className="relative h-screen flex flex-col items-center justify-between text-center overflow-hidden pt-12 pb-16">
            <div 
              className="absolute inset-0 bg-cover bg-[69.5%_center] transition-all duration-[2000ms] scale-105"
              style={{ backgroundImage: `url(${COUPLE_PHOTOS.hero})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/55" />
    
            <div className="absolute top-6 right-6 z-30">
              <button 
                onClick={onToggleMusic}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[9px] font-medium tracking-widest text-white border border-white/20 hover:bg-white/20 transition-all active:scale-95"
              >
                {isMusicPlaying ? (
                  <>
                    <Volume2 className="w-3 h-3 text-[#C5A880] animate-bounce" />
                    <span>CHIMES: ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3 h-3 text-white/70" />
                    <span className="text-white/70">MUTED</span>
                  </>
                )}
              </button>
            </div>
    
            <div className="relative z-10 flex flex-col items-center text-center mt-14 sm:mt-20 px-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              <span className="text-white/80 uppercase tracking-[0.5em] text-[9px] sm:text-[10px] mb-8 font-light">
                Together with their families
              </span>
              <h1 className="text-white text-4xl sm:text-5xl md:text-6xl font-serif font-light tracking-[0.25em] leading-tight uppercase mb-12 sm:mb-16">
                JESSICA
                <br />
                <span className="text-2xl sm:text-3xl text-[#EADCC9] italic mx-2 font-thin lowercase block my-3">&</span>
                WILLIAM
              </h1>
    
              <p className="text-white/80 uppercase tracking-[0.5em] text-[9px] sm:text-[10px] mb-8 font-light">
                invite you to celebrate <br /> their wedding day
              </p>
            </div>
    
            <div 
              className="relative z-10 flex flex-col items-center text-white/90 animate-bounce cursor-pointer opacity-80 hover:opacity-100 transition-opacity" 
              onClick={onBeginClick}
            >
              <span className="text-[9px] uppercase tracking-[0.4em] mb-4 font-serif font-light">Begin</span>
              <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent" />
            </div>
          </section>
        );
    }
