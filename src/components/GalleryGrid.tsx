"use client";
import { Check } from 'lucide-react';
import { isVideoFile } from '@/utils/galleryHelpers';

interface MediaItem {
  type?: string;
  url: string;
  key: string;
  isVideo?: boolean;
}

interface GalleryGridProps {
  mediaGallery: MediaItem[];
  isDeleteMode: boolean;
  selectedKeys: string[];
  toggleSelection: (key: string) => void;
  setLightboxIndex: (index: number) => void;
}

export default function GalleryGrid({
  mediaGallery,
  isDeleteMode,
  selectedKeys,
  toggleSelection,
  setLightboxIndex,
}: GalleryGridProps) {
  if (mediaGallery.length === 0) {
    return (
      <div className="text-center py-16 text-[#7D7261] text-xs uppercase tracking-[0.2em] border border-dashed border-[#EADCC9] rounded-sm">
        No moments shared yet. Be the first to upload!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {mediaGallery.map((media, idx) => {
        const safeKey = media.key || `gallery-item-${idx}`;
        const isSelected = selectedKeys.includes(safeKey);
        const isVideo = media.isVideo || isVideoFile(media.url);

        return (
          <div 
            key={safeKey} 
            onClick={(e) => {
              e.preventDefault();
              if (isDeleteMode) {
                toggleSelection(safeKey);
              } else {
                setLightboxIndex(idx);
              }
            }}
            className={`aspect-square bg-[#EADCC9] overflow-hidden relative group rounded-sm transition-all cursor-pointer ${
              isDeleteMode && isSelected ? 'ring-[2px] ring-[#BE123C] scale-[0.96] shadow-lg' : 'hover:opacity-95'
            }`}
          >
            {isDeleteMode && (
              <div className={`absolute top-2 left-2 z-40 flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-md transition-all ${
                isSelected ? 'bg-[#BE123C] border-[#BE123C]' : 'bg-black/40 border-white'
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </div>
            )}

            {isVideo ? (
              <video src={media.url} className={`w-full h-full object-cover pointer-events-none ${isDeleteMode && selectedKeys.length > 0 && !isSelected ? 'opacity-50 saturate-50' : ''}`} muted autoPlay loop playsInline />
            ) : (
              <img src={media.url} alt="Wedding moment" className={`w-full h-full object-cover pointer-events-none ${isDeleteMode && selectedKeys.length > 0 && !isSelected ? 'opacity-50 saturate-50' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}