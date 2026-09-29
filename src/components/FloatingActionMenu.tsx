import Link from 'next/link';
import { MapPin, Calendar, Image as ImageIcon, Users, Menu, X } from 'lucide-react';

interface FloatingActionMenuProps {
  showFAB: boolean;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onScrollTo: (id: string) => void;
  onOpenRsvp: () => void;
  showGallery: boolean;
}

export default function FloatingActionMenu({ 
  showFAB, 
  isMenuOpen, 
  onToggleMenu, 
  onScrollTo, 
  onOpenRsvp,
  showGallery,
}: FloatingActionMenuProps) {
  
  if (!showFAB) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 animate-fade-in">
      
      {/* Sub-menu options */}
      {isMenuOpen && (
        <div className="flex flex-col items-end gap-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <button 
            onClick={() => onScrollTo('map')}
            className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform transition-all"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Venue & Map</span>
          </button>
          
          <button 
            onClick={() => onScrollTo('timings')}
            className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Wedding Itinerary</span>
          </button>

          {showGallery && <Link
            href="/share-gallery"
            className="bg-white hover:bg-[#C5A880] text-[#5C5346] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#EADCC9] shadow-md flex items-center gap-2 transform transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Shared Gallery</span>
          </Link>}

          {/* RSVP Action integrated in list */}
          <button 
            onClick={onOpenRsvp}
            className="bg-[#C5A880] text-white hover:bg-[#B3966E] text-xs font-bold px-4 py-2 rounded-full shadow-md flex items-center gap-2 transform transition-all mt-1"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage RSVP</span>
          </button>
        </div>
      )}

      {/* Primary Multi-Action Dial (Core Toggle) */}
      <button
        onClick={onToggleMenu}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform active:scale-95 ${
          isMenuOpen 
            ? 'bg-[#5C5346] text-white hover:bg-[#4a4238]' 
            : 'bg-[#C5A880] text-white hover:bg-[#B3966E] hover:scale-110'
        }`}
        title="Toggle Menu"
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  );
}
