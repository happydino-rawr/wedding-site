import { Clock, Info, MapPin, Navigation } from 'lucide-react';

interface CeremonyVenueSectionProps {
  ceremonyName: string;
  ceremonyAddress: string;
}

export default function CeremonyVenueSection({ ceremonyName, ceremonyAddress }: CeremonyVenueSectionProps) {
  return (
    <section id="map" className="py-20 bg-[#FDFBF7]">
      <div className="space-y-12 text-center">
        
        {/* Header Section (Constrained) */}
        <div className="max-w-2xl mx-auto px-4 space-y-3">
          <span className="text-[18px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Ceremony Location</span>
          <h2 className="text-3xl font-serif font-light text-[#4A433A] tracking-wide">{ceremonyName}</h2>
          <p className="text-sm text-[#7D7261]">{ceremonyAddress}</p>
        </div>

        {/* --- FULL-WIDTH BACKGROUND SECTION --- */}
        <div className="w-full border-y border-[#EADCC9]/40 bg-[#FAF6F0] py-10">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <VenueDetail icon={Clock} title="Arrival">
              Please arrive <span className="font-medium text-[#4A433A]">30 minutes early</span> to allow time for parking and the walk to Harbour Lawn for the ceremony.
            </VenueDetail>
            <VenueDetail icon={MapPin} title="Metered Parking">
              Metered street parking is available on Mrs Macquaries Road and Hospital Road. Please note that parking is limited and may require a short walk to the venue.
            </VenueDetail>
            <VenueDetail icon={Info} title="Rail Transit">
              St James, Martin Place and Circular Quay Stations are all a 10-minute walk from the venue.
            </VenueDetail>
          </div>
        </div>

        {/* Map & Directions Button Section (Constrained) */}
        <div className="max-w-2xl mx-auto px-4 space-y-8">
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
            className="inline-flex items-center gap-2.5 px-4 py-2 text-[15px] sm:px-8 sm:py-3 sm:text-xs rounded-sm border border-[#BE123C] text-[#BE123C] font-semibold uppercase tracking-[0.2em] hover:bg-[#BE123C] hover:text-white transition-all duration-300 active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Route Directions</span>
          </a>
        </div>

      </div>
    </section>
  );
}

function VenueDetail({ icon: Icon, title, children }: { icon: typeof Clock; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 text-center">
      <Icon className="mx-auto h-6 w-6 text-[#C5A880]" />
      <h3 className="font-serif text-xl font-light text-[#4A433A]">{title}</h3>
      <p className="text-xs leading-relaxed text-[#7D7261]">{children}</p>
    </div>
  );
}
