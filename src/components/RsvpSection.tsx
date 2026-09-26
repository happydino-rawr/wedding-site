import { Heart, Users } from 'lucide-react';

interface RsvpSectionProps {
  onOpenRsvp: () => void;
  deadlineLabel: string;
}

export default function RsvpSection({ onOpenRsvp, deadlineLabel }: RsvpSectionProps) {
  return (
    <section className="py-24 px-4 bg-[#FAF6F0] flex justify-center">
      <div className="bg-white border border-[#EADCC9] shadow-xl p-10 sm:p-16 rounded-sm max-w-2xl w-full text-center relative overflow-hidden">
        <div className="absolute inset-4 sm:inset-5 border border-[#EADCC9]/80 border-dashed pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-8 sm:space-y-10">
          <Heart className="w-6 h-6 text-[#C5A880] fill-current opacity-90" />

          <div className="space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl text-[#4A433A] tracking-wide">
              RSVP
            </h2>
            <div className="w-12 sm:w-16 h-[1px] bg-[#C5A880] mx-auto" />
          </div>

          <div className="space-y-2 py-2">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-[#C5A880] font-bold block">
              Kindly Reply By
            </span>
            <p className="font-serif italic text-2xl sm:text-3xl text-[#BE123C] pt-1">
              {deadlineLabel}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-md mx-auto px-2">
            We eagerly await your response to help us finalise our celebration. Please let us know if you can attend and note any dietary requirements.
          </p>

          <div className="w-full pt-4 border-t border-[#FAF6F0]">
            <button
              onClick={onOpenRsvp}
              className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#C5A880] hover:bg-[#B3956D] text-white text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] rounded-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Please RSVP Here</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}