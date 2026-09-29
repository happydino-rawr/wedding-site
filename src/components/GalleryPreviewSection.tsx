import React from 'react';
import { Camera } from 'lucide-react';
import { MediaItem } from '../app/page';

interface GalleryPreviewProps {
  mediaGallery: MediaItem[];
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string;
  uploadToast: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFullGallery: () => void;
  onSetLightboxIndex: (index: number) => void;
}

export default function GalleryPreviewSection({
  mediaGallery,
  isUploading,
  uploadProgress,
  uploadError,
  uploadToast,
  onUpload,
  onOpenFullGallery,
  onSetLightboxIndex,
}: GalleryPreviewProps) {
  return (
    <section id="gallery-header" className="py-24 px-4 bg-[#FDFBF7] overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div className="text-center space-y-3">
          <span className="text-[15px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Capture the Day</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Our Shared Gallery</h2>
          <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          <p className="text-[20px] text-[#7D7261] max-w-md mx-auto pt-4 leading-relaxed">
            Our story, seen through your eyes. Please upload your photos below to help us preserve every single moment of our special day.          </p>
          <p className="text-[20px] text-[#7D7261] max-w-md mx-auto pt-2 leading-relaxed">
            用您的视角，记录我们的故事。请点击下方按钮上传照片，与我们一同珍藏这一天的美好瞬间。
          </p>
        </div>

        {/* Elevated Solid Gold Upload Button */}
        <div className="flex justify-center">
          <label className={`inline-flex items-center gap-2.5 px-8 py-3.5 ${isUploading ? 'bg-[#BFB69A] cursor-not-allowed' : 'bg-[#C5A880] hover:bg-[#B3956D]'} text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm shadow-sm ${isUploading ? '' : 'hover:shadow-md'} transition-all duration-300 transform ${isUploading ? '' : 'hover:-translate-y-0.5'} active:scale-95 cursor-pointer`}>
            <Camera className="w-4 h-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload Moments'}</span>
            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/quicktime,video/x-m4v"
              onChange={onUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {isUploading && (
          <div className="mt-6 max-w-xl mx-auto">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#5C5346] mb-2">
              <span>Uploading your memories</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#EDE7DC] overflow-hidden border border-[#EADCC9]">
              <div className="h-full bg-[#C5A880] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 flex justify-center">
            <div className="rounded-sm bg-[#FDF2F8] border border-[#F9A8D4] px-4 py-2 text-sm text-[#BE185D] shadow-sm">
              {uploadError}
            </div>
          </div>
        )}

        {uploadToast && !isUploading && (
          <div className="mt-6 flex justify-center">
            <div className="rounded-sm bg-[#FDF2F8] border border-[#F9A8D4] px-4 py-2 text-sm text-[#BE185D] shadow-sm">
              {uploadToast}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {mediaGallery.slice(0, 6).map((media, idx) => {
            const isVideo = 
              media.type?.startsWith?.('video') || 
              media.type === 'video' || 
              /\.(mp4|mov|m4v|webm|avi|mkv)/i.test(media.url);

            return (
              <div 
                key={idx} 
                onClick={() => onSetLightboxIndex(idx)}
                className="aspect-square bg-[#EADCC9] overflow-hidden relative group rounded-sm cursor-pointer border border-[#EADCC9]/50 shadow-xs"
              >
                {isVideo ? (
                  <video src={media.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                ) : (
                  <img 
                    src={media.url} 
                    alt="Wedding moment" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-90 group-hover:opacity-100" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {mediaGallery.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={onOpenFullGallery}
              className="inline-flex items-center gap-2.5 px-8 py-3 bg-[#FAF8F5] hover:bg-[#C5A880] text-[#7D7261] hover:text-white border border-[#C5A880]/60 text-xs font-semibold uppercase tracking-[0.2em] rounded-sm shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-3.5 h-3.5"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>{mediaGallery.length > 6 ? 'View Full Grid' : 'Manage Gallery'}</span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
}