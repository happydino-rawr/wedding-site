import React from 'react';
import { ArrowLeft, Trash2, Check } from 'lucide-react';
import { MediaItem } from '../app/page'; // Adjust path if needed depending on where page.tsx is

interface FullGalleryModalProps {
  mediaGallery: MediaItem[];
  onClose: () => void;
  lightboxIndex: number | null;
  setLightboxIndex: (index: number | null) => void;
  isDeleteMode: boolean;
  setIsDeleteMode: (val: boolean) => void;
  selectedKeys: string[];
  setSelectedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  showDeleteModal: boolean;
  setShowDeleteModal: (val: boolean) => void;
  deleteStatus: 'idle' | 'deleting' | 'success' | 'error';
  setKeysToDelete: (keys: string[]) => void;
  keysToDelete: string[];
}

export default function FullGalleryModal({
  mediaGallery,
  onClose,
  lightboxIndex,
  setLightboxIndex,
  isDeleteMode,
  setIsDeleteMode,
  selectedKeys,
  setSelectedKeys,
  showDeleteModal,
  setShowDeleteModal,
  deleteStatus,
  setKeysToDelete,
  keysToDelete,
}: FullGalleryModalProps) {

  const toggleSelection = (key: string) => {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#FDFBF7] flex flex-col animate-fade-in overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#EADCC9] bg-[#FDFBF7] z-30">
          <h2 className="font-serif text-xl text-[#4A433A] font-light">Full Gallery Grid</h2>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsDeleteMode(!isDeleteMode);
                setSelectedKeys([]);
              }}
              className="inline-flex items-center gap-2.5 px-4 py-2 text-[10px] sm:px-8 sm:py-3 sm:text-xs uppercase tracking-[0.2em] transition-all rounded-sm border shadow-sm bg-[#FAF8F5] border-[#C5A880]/60 text-[#5C5346] hover:bg-[#C5A880] hover:text-white"
            >
              {isDeleteMode ? 'Cancel Selection' : 'Select for Delete'}
            </button>

            {isDeleteMode && selectedKeys.length > 0 && (
              <button 
                onClick={() => {
                  setKeysToDelete(selectedKeys);
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center gap-2.5 px-4 py-2 text-[10px] sm:px-8 sm:py-3 sm:text-xs rounded-sm border border-[#BE123C] text-[#BE123C] font-semibold uppercase tracking-[0.2em] hover:bg-[#BE123C] hover:text-white transition-all duration-300 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedKeys.length})
              </button>
            )}

            <button 
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#7D7261] hover:text-[#4A433A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Invite
            </button>
          </div>
        </div>

        {/* Gallery Grid Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mediaGallery.map((media: MediaItem, idx: number) => {
                const rawUrl = media.url;
                const safeKey = media.key || `gallery-item-${idx}`;
                const isSelected = selectedKeys.includes(safeKey);
                const isVideo = media.isVideo === true || media.type?.startsWith('video') === true || /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i.test(rawUrl || '');

                return (
                  <div 
                    key={safeKey} 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isDeleteMode) {
                        toggleSelection(safeKey);
                      } else {
                        setLightboxIndex(idx);
                      }
                    }}
                    className={`aspect-square bg-[#EADCC9] overflow-hidden relative group rounded-sm transition-all duration-200 cursor-pointer ${
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
                      <video src={rawUrl} className="w-full h-full object-cover pointer-events-none" muted autoPlay loop playsInline preload="auto" />
                    ) : (
                      <img src={rawUrl} alt={`Gallery item ${idx}`} className="w-full h-full object-cover pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && mediaGallery[lightboxIndex] && (() => {
        const currentItem = mediaGallery[lightboxIndex];
        const isVideo = currentItem.isVideo || currentItem.type?.startsWith('video') || /\.(mp4|mov|m4v|webm|avi|mkv)(\?.*)?$/i.test(currentItem.url);

        return (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
            <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white text-2xl z-50 hover:opacity-75 p-2">✕</button>
            <div className="max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center p-4">
              {isVideo ? (
                <video src={currentItem.url} controls autoPlay playsInline className="max-w-full max-h-[80vh] object-contain" />
              ) : (
                <img src={currentItem.url} alt="Expanded item" className="max-w-full max-h-[80vh] object-contain" />
              )}
            </div>
            <div className="absolute bottom-6 flex items-center gap-4 text-white text-xs">
              <button disabled={lightboxIndex === 0} onClick={() => setLightboxIndex(lightboxIndex - 1)} className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-sm">Prev</button>
              <span>{lightboxIndex + 1} / {mediaGallery.length}</span>
              <button disabled={lightboxIndex === mediaGallery.length - 1} onClick={() => setLightboxIndex(lightboxIndex + 1)} className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-sm">Next</button>
            </div>
          </div>
        );
      })()}
    </>
  );
}