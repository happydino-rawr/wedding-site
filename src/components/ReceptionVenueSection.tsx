import { Info, MapPin, Navigation } from 'lucide-react';
import { COUPLE_PHOTOS } from '../lib/constants';

interface ReceptionVenueSectionProps {
  receptionName: string;
  receptionAddress: string;
}

export default function ReceptionVenueSection({ receptionName, receptionAddress }: ReceptionVenueSectionProps) {
  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-4 mt-4 sm:mt-12 mb-4 sm:mb-8">
        <img
          src={COUPLE_PHOTOS.reception_pic}
          alt="Couple photo"
          className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50"
        />
      </div>

      {/* Reduced bottom padding on section from py-20 to pt-20 pb-8 sm:pb-12 */}
      <section id="map" className="pt-20 pb-8 sm:pb-5 bg-[#FDFBF7]">
        <div className="space-y-12 text-center">
          
          {/* Location Details (Constrained) */}
          <div className="max-w-2xl mx-auto px-4 space-y-3">
            <span className="text-[12px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Reception Location</span>
            <h2 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">{receptionName}</h2>
            <p className="text-sm text-[#7D7261]">{receptionAddress}</p>
            <p className="font-serif italic text-sm text-[#7D7261] pt-2">
              Following the ceremony, please join us for our wedding reception.
            </p>
          </div>

          {/* --- FULL-WIDTH BACKGROUND SECTION --- */}
          <div className="w-full border-y border-[#EADCC9]/40 bg-[#FAF6F0] py-10">
            <div className="max-w-4xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center max-w-xl mx-auto">
                <div className="space-y-3">
                  <MapPin className="mx-auto h-6 w-6 text-[#C5A880]" />
                  <h3 className="font-serif text-xl font-light text-[#4A433A]">Free Parking</h3>
                  <p className="text-xs leading-relaxed text-[#7D7261]">Complimentary onsite parking is available.</p>
                </div>
                <div className="space-y-3">
                  <Info className="mx-auto h-6 w-6 text-[#C5A880]" />
                  <h3 className="font-serif text-xl font-light text-[#4A433A]">Rail Transit</h3>
                  <p className="text-xs leading-relaxed text-[#7D7261]">10 minute walk from Cabramatta and Canley Vale Station.</p>
                </div>
              </div>

              {/* Photo ID Note Box */}
              <div className="max-w-md mx-auto mt-10 p-4 rounded-xl bg-[#F4EFE6]/50 border border-[#EADCC9]/60 space-y-1.5 text-center sm:text-left">
                <p className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">Please Note</p>
                <p className="text-xs text-[#7D7261] leading-relaxed">
                  All guests must present a <strong className="font-semibold text-[#BE123C]">valid form of photo ID </strong> upon arrival to sign into the venue (e.g., Passport, Driver&apos;s Licence, or Proof of Age Card).
                </p>
              </div>
            </div>
          </div>

          {/* Map & Directions Section (Constrained) */}
          <div className="max-w-2xl mx-auto px-4 space-y-8">
            <div className="rounded-sm overflow-hidden shadow-md border border-[#EADCC9] aspect-video relative">
              <iframe
                src="https://maps.google.com/maps?q=Cabravale+Club+Resort,+1+Bartley+St,+Canley+Vale+NSW+2166&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Cabravale+Club+Resort+1+Bartley+St+Canley+Vale+NSW+2166"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2 text-[10px] sm:px-8 sm:py-3 sm:text-xs rounded-sm border border-[#BE123C] text-[#BE123C] font-semibold uppercase tracking-[0.2em] hover:bg-[#BE123C] hover:text-white transition-all duration-300 active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route Directions</span>
            </a>
          </div>

        </div>
      </section>
    </>
  );
}