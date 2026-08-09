import { Play, Pause } from 'lucide-react';
import { COUPLE_PHOTOS } from '../lib/constants';

interface VinylVisualizerProps {
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
}

export default function VinylVisualizerSection({ isMusicPlaying, onToggleMusic }: VinylVisualizerProps) {
  return (
      <section id="interactive" className="py-24 px-4 bg-[#FDFBF7] flex flex-col items-center">
        <div className="w-full max-w-[360px] relative flex flex-col items-center pt-8">

          {/* 1. Black Vinyl Background (Z-10) */}
          <div 
            className={`absolute top-0 w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] rounded-full shadow-2xl bg-[#111111] border-[5px] border-[#222222] shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex items-center justify-center z-10 ${isMusicPlaying ? "animate-[spin_4s_linear_infinite]" : ""}`}
            style={{ backgroundImage: "repeating-radial-gradient(circle, #222222, #111111 2px, #222222 4px)" }}
          >
            <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full pointer-events-none">
              <path id="vinyl-curve" d="M 40,160 A 120,120 0 0,1 280,160" fill="transparent" />
              <text className="text-[14px] uppercase tracking-[0.4em] font-serif fill-[#FDFBF7] opacity-90">
                <textPath href="#vinyl-curve" startOffset="50%" textAnchor="middle">
                  《 A Single Thought 》
                </textPath>
              </text>
            </svg>
            <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-20 rounded-full border border-white/10 pointer-events-none" />
          </div>

          {/* 2. Main Portrait Photo (Z-0) */}
          <div className="relative z-0 w-full bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-white mt-[210px] sm:mt-[230px]">
            <img src={COUPLE_PHOTOS.vinyl_portrait} className="w-full h-[480px] sm:h-[520px] object-cover" alt="Couple portrait" />
            
            {/* Sleek Frosted Glass Play/Pause Button */}
            <button
              onClick={onToggleMusic}
              className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/50 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-all hover:bg-white/30 active:scale-95 z-30"
            >
              {isMusicPlaying ? (
                <Pause className="w-5 h-5 fill-white text-white" />
              ) : (
                <Play className="w-5 h-5 fill-white text-white ml-1" />
              )}
              {/* Spinning decorative ring when playing */}
              <div className={`absolute -inset-1.5 rounded-full border border-white/40 border-dashed pointer-events-none ${isMusicPlaying ? 'animate-[spin_8s_linear_infinite]' : 'hidden'}`} />
            </button>

            {/* Elegant Audio Visualizer */}
            <div className="absolute bottom-8 left-6 flex items-end gap-[3px] h-8 z-30 opacity-90">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div 
                  key={bar} 
                  className={`w-[3px] bg-white rounded-t-sm transition-all duration-300 ${isMusicPlaying ? 'opacity-100' : 'opacity-40'}`} 
                  style={{ 
                    height: isMusicPlaying ? `${Math.max(6, Math.random() * 24)}px` : '4px',
                    transitionDelay: `${bar * 50}ms` 
                  }} 
                />
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>

          {/* 3. Quote Card (Z-20, Overlapping Vinyl and Photo) */}
          <div className="absolute top-[180px] sm:top-[200px] z-20 w-[120%] bg-white/85 px-6 py-8 pt-10 rounded-sm shadow-[0_0px_15px_rgba(0,0,0,0.80)] border border-white/50 text-center">
            <p className="font-serif italic text-xs sm:text-sm leading-loose text-[#5C5346] tracking-wide">
              "If the sun were to rise in the west, <br />
              I'd never change my mind to love you forever. <br />
              I love you not for who you are, but for who I am before you."
            </p>
          </div>

          {/* 4. Vinyl Center Photo (Z-30, Overlapping Quote Card) */}
          <div className="absolute top-[100px] sm:top-[110px] z-30 w-[110px] h-[110px] rounded-full bg-[#FDFBF7] border-[3px] border-[#FDFBF7] shadow-xl overflow-hidden flex items-center justify-center">
            <img 
              src={COUPLE_PHOTOS.vinyl_center} 
              alt="Center Spindle" 
              className={`w-full h-full object-cover ${isMusicPlaying ? "animate-[spin_4s_linear_infinite]" : ""}`} 
            />
            <div className="absolute w-3 h-3 rounded-full bg-[#FDFBF7] shadow-inner" />
          </div>

        </div>
      </section>
  );
}
