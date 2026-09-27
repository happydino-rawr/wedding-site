import { COUPLE_PHOTOS } from '../lib/constants';

interface ItinerarySectionProps {
  isWeddingDay: boolean;
  currentEventIndex: number;
  weddingInfo: {
    ceremonyTime: string;
    receptionTime: string;
    ceremonyName: string;
    receptionName: string;
  };
}

export default function ItinerarySection({ isWeddingDay, currentEventIndex, weddingInfo }: ItinerarySectionProps) {
  return (
    <>
      <section id="timings" className="py-24 bg-[#FDFBF7]">
        
        {/* --- 1. TOP PHOTO (itinery_pic) WITH TOP BORDER --- */}
        <div className="w-full max-w-4xl mx-auto px-4 mb-16 sm:mb-20 pt-15 sm:pt-20 border-t border-[#EADCC9]/50">
          <img
            src={COUPLE_PHOTOS.itinery_pic}
            alt="Couple photo"
            className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50"
          />
        </div>

        {/* --- 2. ITINERARY SEQUENCE --- */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center space-y-3 mb-16">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-bold">The Sequence</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Wedding Itinerary</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-[1px] h-full bg-[#C5A880]" />

            <div className="space-y-12 relative z-10">
              {[
                { time: '1:30 PM', title: 'Guest Arrival', desc: `Arrive early at ${weddingInfo.ceremonyName} and settle in before the ceremony.` },
                { time: weddingInfo.ceremonyTime, title: 'The Ceremony', desc: `Join us at ${weddingInfo.ceremonyName} as we exchange our vows.` },
                { time: '3:30 PM', title: 'Travel & Rest', desc: 'A short break to transition before the evening celebration.' },
                { time: weddingInfo.receptionTime, title: 'Reception', desc: `Continue the celebration at ${weddingInfo.receptionName}.` },
              ].map((item, idx) => {
                const isHappeningNow = isWeddingDay && currentEventIndex === idx;

                return (
                  <div key={idx} className={`flex flex-row items-center w-full relative transition-all duration-500 ${isHappeningNow ? 'scale-105' : 'opacity-70'}`}>
                    <div className="w-1/2 pr-6 sm:pr-12 text-right">
                      <span className={`font-serif italic text-sm sm:text-lg tracking-wide ${isHappeningNow ? 'text-[#BE123C] font-bold' : 'text-[#C5A880]'}`}>
                        {item.time}
                      </span>
                    </div>

                    <div className={`absolute left-1/2 transform -translate-x-1/2 rounded-full z-20 transition-all duration-500 ${isHappeningNow ? 'w-4 h-4 bg-[#BE123C] ring-4 ring-[#FDF2F8] shadow-lg animate-pulse' : 'w-3 h-3 bg-[#C5A880] ring-4 ring-[#FDFBF7]'}`} />

                    <div className="w-1/2 pl-6 sm:pl-12 text-left relative">
                      {isHappeningNow && (
                        <span className="absolute -top-5 left-6 sm:left-12 text-[8px] uppercase tracking-widest text-[#BE123C] font-bold bg-[#FDF2F8] px-2 py-0.5 rounded-sm">Happening Now</span>
                      )}
                      <h4 className={`font-serif text-sm sm:text-xl mb-1 ${isHappeningNow ? 'font-bold text-[#BE123C]' : 'font-bold text-[#4A433A]'}`}>
                        {item.title}
                      </h4>
                      <p className={`text-[11px] sm:text-sm leading-relaxed max-w-xs whitespace-pre-line ${isHappeningNow ? 'text-[#4A433A] font-medium' : 'text-[#7D7261]'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- 3. ATTIRE ETIQUETTE & HARBOUR PHOTO SECTION --- */}
        <div className="pt-15 mt-10 text-center">
          
          {/* Harbour Photo */}
          <div className="w-full max-w-4xl mx-auto px-4 mt-4 sm:mt-6 mb-12 sm:mb-16">
            <img
              src={COUPLE_PHOTOS.harbour_pic}
              alt="RSVP transition layout"
              className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50"
            />
          </div>

          {/* Dress Code Header & Description */}
          <div className="max-w-2xl mx-auto px-4 pt-10 space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-bold">Attire Etiquette</span>
            <h2 className="text-2xl font-serif font-light text-[#4A433A] tracking-wide">Dress Code Guide</h2>
            <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-2" />
            <p className="text-xs sm:text-sm text-[#7D7261] leading-relaxed max-w-lg mx-auto">
              We kindly invite you to dress in formal attire for our celebration. Please feel free to wear whatever makes you feel comfortable and confident! For those who'd like a little inspiration, here are a few soft, earthy tones that complement our wedding palette:
            </p>
          </div>

          {/* Color Swatches */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 px-4 max-w-2xl mx-auto pb-4">
            {[
              { hex: 'bg-[#e9d2ac]', name: 'Champagne' },
              { hex: 'bg-[#ce9297]', name: 'Dusty Rose' },
              { hex: 'bg-[#e6bbbb]', name: 'Baby Pink' },
              { hex: 'bg-[#c5d7c3]', name: 'Soft Sage' },
              { hex: 'bg-[#8a9689]', name: 'Earthy Green' },
              { hex: 'bg-[#e2cfbe]', name: 'Soft Oat' },
            ].map((color, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-3 group cursor-pointer w-20">
                <div className={`w-12 h-12 rounded-full ${color.hex} shadow-sm border border-white/50 ring-1 ring-[#EADCC9] group-hover:ring-[#C5A880] transition-all duration-300 transform group-hover:scale-105`} />
                <span className="text-[9px] text-center text-[#7D7261] uppercase tracking-widest leading-tight">{color.name}</span>
              </div>
            ))}
          </div>
          <div className="w-full max-w-4xl mx-auto px-4 pt-25 pb-0">
            <div className="border-b border-[#EADCC9]/50 w-full" />
          </div>
        </div>
      </section>
    </>
  );
}