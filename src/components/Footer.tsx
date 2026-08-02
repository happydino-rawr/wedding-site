import { Heart } from 'lucide-react';

export default function Footer() {
  return (
      <footer className="py-16 bg-[#FDFBF7] text-center border-t border-[#EADCC9]/50 text-xs text-[#9C8F7E] tracking-widest space-y-4">
        <Heart className="w-5 h-5 mx-auto text-[#C5A880] fill-current opacity-70" />
        <p className="font-serif text-sm text-[#5C5346]">JESSICA & WILLIAM'S WEDDING</p>
        <p className="text-[9px] uppercase tracking-[0.3em]">March 6, 2027</p>
      </footer>
  );
}