import { Navigation } from 'lucide-react';

interface CeremonyVenueSectionProps {
  ceremonyName: string;
  ceremonyAddress: string;
}

export default function CeremonyVenueSection({ ceremonyName, ceremonyAddress }: CeremonyVenueSectionProps) {
  return (
    <section id="map" className="py-20 px-4 bg-[#FDFBF7]">
      <div className="max-w-2xl mx-auto space-y-12 text-center">
        <div className="space-y-3">
          <span className="text-[12px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Ceremony Location</span>
          <h2 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">{ceremonyName}</h2>
          <p className="text-sm text-[#7D7261]">{ceremonyAddress}</p>
        </div>

        <div className="rounded-sm overflow-hidden shadow-md border border-[#EADCC9] aspect-video relative">
          <iframe
            src="https://maps.google.com/maps?q=Harbour+View+Lawn,+Royal+Botanic+Garden+Sydney&t=&z=16&ie=UTF8&iwloc=&output=embed"
            className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <a
          href="https://www.google.com/maps/search/?api=1&query=Harbour+View+Lawn+Royal+Botanic+Garden+Sydney"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-4 py-2 text-[10px] sm:px-8 sm:py-3 sm:text-xs rounded-sm border border-[#BE123C] text-[#BE123C] font-semibold uppercase tracking-[0.2em] hover:bg-[#BE123C] hover:text-white transition-all duration-300 active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Route Directions</span>
        </a>
      </div>
    </section>
  );
}
