import { Clock, MapPin, Info, Navigation } from 'lucide-react';
import { COUPLE_PHOTOS } from '../lib/constants';

interface ReceptionVenueSectionProps {
  receptionName: string;
  receptionAddress: string;
}

export default function ReceptionVenueSection({ receptionName, receptionAddress }: ReceptionVenueSectionProps) {
  return (
    <>
      <section className="py-12 px-4 bg-[#FAF6F0] border-y border-[#EADCC9]/40">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <Clock className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Arrival</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Please arrive <span className="font-medium text-[#4A433A]">30 minutes early</span> to allow time for parking
              <br />
              and the walk to Harbour Lawn for the ceremony.
            </p>
          </div>

          <div className="text-center space-y-3">
            <MapPin className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Metered Parking</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Metered street parking is available on Mrs Macquaries Road and Hospital Road.
              <br />
              Please note that parking is limited and may require a short walk to the venue.
            </p>
          </div>

          <div className="text-center space-y-3">
            <Info className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Rail Transit</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              St James, Martin Place and Circular Quay Stations are all a 10-minute walk from the venue.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full max-w-4xl mx-auto px-4 mt-4 sm:mt-12 mb-4 sm:mb-8">
        <img
          src={COUPLE_PHOTOS.couple_pic}
          alt="Couple photo"
          className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50"
        />
      </div>

      <section id="map" className="py-20 px-4 bg-[#FDFBF7]">
        <div className="max-w-2xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <span className="text-[12px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Reception Location</span>
            <h2 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">{receptionName}</h2>
            <p className="text-sm text-[#7D7261]">{receptionAddress}</p>
            <p className="font-serif italic text-sm text-[#7D7261] pt-2">
              Following the ceremony, please join us for our wedding reception.
            </p>
          </div>

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
      </section>

      <section className="py-12 px-4 bg-[#FAF6F0] border-y border-[#EADCC9]/40">
        <div className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center space-y-3">
            <MapPin className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Free Parking</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              Complimentary onsite parking is available.
            </p>
          </div>

          <div className="text-center space-y-3">
            <Info className="w-6 h-6 text-[#C5A880] mx-auto" />
            <h4 className="font-serif font-light text-xl text-[#4A433A]">Rail Transit</h4>
            <p className="text-xs text-[#7D7261] leading-relaxed">
              10 minute walk from Cabramatta and Canley Vale Station.
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto mt-10 p-4 rounded-xl bg-[#F4EFE6]/50 border border-[#EADCC9]/60 space-y-1.5 text-center sm:text-left">
          <p className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">Please Note</p>
          <p className="text-xs text-[#7D7261] leading-relaxed">
            All guests must present a <strong className="font-semibold text-[#BE123C]">valid form of photo ID</strong> upon arrival to sign into the venue (e.g., Passport, Driver's Licence, or Proof of Age Card).
          </p>
        </div>
      </section>

      <div className="w-full max-w-4xl mx-auto px-4 my-8 sm:my-12">
        <img
          src={COUPLE_PHOTOS.couple_pic}
          alt="Couple photo"
          className="w-full h-56 sm:h-80 object-cover rounded-sm shadow-md border border-[#EADCC9]/50"
        />
      </div>
    </>
  );
}
