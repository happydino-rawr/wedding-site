import { Heart } from 'lucide-react';
import { COUPLE_PHOTOS } from '../lib/constants';

interface CountdownSectionProps {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
}

export default function CountdownSection({ timeLeft }: CountdownSectionProps) {
  return (
    <>
      <section id="countdown-anchor" className="pt-0 pb-16 px-4 bg-[#FDFBF7] relative overflow-hidden flex flex-col items-center justify-center border-b border-[#EADCC9]/30">
        <div className="text-center space-y-4 relative z-10 max-w-2xl w-full">
          <div className="space-y-3">
            <span className="text-[9px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">The Promise</span>
            <p className="font-serif italic text-base sm:text-lg text-[#7D7261] tracking-wide">
              "Counting down to our forever..."
            </p>
          </div>
          <div className="flex items-center justify-center gap-5 sm:gap-10">
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#BE123C] tracking-wider">{timeLeft.days}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Days</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#BE123C] tracking-wider">{timeLeft.hours}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Hours</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#BE123C] tracking-wider">{timeLeft.minutes}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Mins</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EADCC9]/50" />
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-serif font-light text-[#BE123C] tracking-wider">{timeLeft.seconds}</span>
              <span className="text-[8px] uppercase tracking-widest text-[#9C8F7E] mt-1 font-semibold">Secs</span>
            </div>
          </div>

          <div className="pt-8 flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8E1C24] via-[#751117] to-[#45090C] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_10px_rgba(117,17,23,0.4)] border border-[#3E090B] flex items-center justify-center relative select-none cursor-pointer transform hover:scale-110 active:scale-95 transition-all duration-300">
              <Heart className="w-4 h-4 text-[#FDEAEA] fill-current opacity-85 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
              <div className="absolute inset-[3px] rounded-full border border-[#FDEAEA]/10 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-4xl mx-auto px-4 mt-4 sm:mt-12 mb-4 sm:mb-8">
        <img
          src={COUPLE_PHOTOS.countdown_photo}
          alt="Couple photo"
          className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50"
        />
      </div>
    </>
  );
}
