"use client";

interface MediaItem {
  type?: string;
  url: string;
  key: string;
  isVideo?: boolean;
}

interface LightboxModalProps {
  lightboxIndex: number | null;
  mediaGallery: MediaItem[];
  isDeleteMode: boolean;
  setLightboxIndex: (index: number | null) => void;
}

export default function LightboxModal({
  lightboxIndex,
  mediaGallery,
  isDeleteMode,
  setLightboxIndex,
}: LightboxModalProps) {
  if (lightboxIndex === null || !mediaGallery[lightboxIndex] || isDeleteMode) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white text-2xl z-50 p-2 hover:opacity-75">✕</button>
      
      <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center">
        {mediaGallery[lightboxIndex].isVideo ? (
          <video src={mediaGallery[lightboxIndex].url} controls autoPlay playsInline className="max-w-full max-h-[80vh] object-contain" />
        ) : (
          <img src={mediaGallery[lightboxIndex].url} alt="Expanded view" className="max-w-full max-h-[80vh] object-contain" />
        )}
      </div>

      <div className="absolute bottom-6 flex items-center gap-4 text-white text-xs">
        <button 
          disabled={lightboxIndex === 0} 
          onClick={() => setLightboxIndex(lightboxIndex - 1)} 
          className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-sm uppercase"
        >
          Prev
        </button>
        <span>{lightboxIndex + 1} / {mediaGallery.length}</span>
        <button 
          disabled={lightboxIndex === mediaGallery.length - 1} 
          onClick={() => setLightboxIndex(lightboxIndex + 1)} 
          className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-sm uppercase"
        >
          Next
        </button>
      </div>
    </div>
  );
}