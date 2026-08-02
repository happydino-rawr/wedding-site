"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, ArrowLeft, Trash2, Check } from 'lucide-react';

interface MediaItem {
  type?: string;
  url: string;
  key: string;
  isVideo?: boolean;
}

export default function ShareGalleryPage() {
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadToast, setUploadToast] = useState<string>("");
  const [_myUploadedKeys, setMyUploadedKeys] = useState<string[]>([]);

  // Deletion States
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keysToDelete, setKeysToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem("my_wedding_uploads");
    if (saved) setMyUploadedKeys(JSON.parse(saved));
    refreshGallery();
  }, []);

  const refreshGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      const publicBaseUrl = "https://pub-24a198c3bcd44e7ab19fd37353cb5c07.r2.dev";
      const rawImages = Array.isArray(data.images) ? data.images : [];

      const parseKeyTimestamp = (key: string) => {
        const match = key.match(/^(\d{13})_/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const sortedImages = [...rawImages].sort((a, b) => parseKeyTimestamp(b) - parseKeyTimestamp(a));

      const itemsWithUrls = sortedImages.map((key: string) => {
        const lowerKey = key.toLowerCase();
        const isVideoFile = /\.(mp4|mov|m4v|webm|avi|mkv|3gp|flv|ogv|qt)(\?.*)?$/i.test(lowerKey) || lowerKey.includes('video');
        return {
          key,
          url: `${publicBaseUrl}/${key}`,
          type: isVideoFile ? 'video/mp4' : 'image/jpeg',
          isVideo: isVideoFile
        };
      });
      setMediaGallery(itemsWithUrls);
    } catch (err) {
      console.error("Failed to refresh gallery:", err);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const totalBytes = filesArray.reduce((sum, file) => sum + file.size, 0);
    let uploadedBytes = 0;
    
    setUploadError("");
    setIsUploading(true);
    setUploadProgress(0);
    setUploadToast("");

    const newOptimisticFiles = filesArray.map((file) => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name);
      return {
        url: URL.createObjectURL(file),
        type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        isVideo,
        key: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };
    });

    setMediaGallery((prev) => [...newOptimisticFiles, ...prev]);

    for (const file of filesArray) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.key) {
            setMyUploadedKeys((prev) => {
              const updated = [...prev, data.key];
              localStorage.setItem("my_wedding_uploads", JSON.stringify(updated));
              return updated;
            });
          }
        }
      } catch (err) {
        setUploadError("Some files failed to upload.");
      } finally {
        uploadedBytes += file.size;
        setUploadProgress(Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)));
      }
    }

    await refreshGallery();
    setIsUploading(false);
    setUploadProgress(0);
    setUploadToast("Uploads complete! Your new photos are now in the gallery.");
    e.target.value = "";
  };

  const toggleSelection = (key: string) => {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const handleBatchDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setDeleteStatus('deleting');
    try {
      const deletePromises = keysToDelete.map(async (key) => {
        const res = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        return { key, ok: res.ok };
      });

      const results = await Promise.all(deletePromises);
      const successfullyDeleted = results.filter(r => r.ok).map(r => r.key);

      setMediaGallery(prev => prev.filter(item => !successfullyDeleted.includes(item.key)));
      setMyUploadedKeys(prev => {
        const updated = prev.filter(k => !successfullyDeleted.includes(k));
        localStorage.setItem("my_wedding_uploads", JSON.stringify(updated));
        return updated;
      });

      setSelectedKeys([]);
      setKeysToDelete([]);
      setDeleteStatus('success');
      setIsDeleteMode(false);
    } catch (err) {
      console.error("Failed to delete items:", err);
      setDeleteStatus('error');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setIsDeleteMode(false);
    setSelectedKeys([]);
    setKeysToDelete([]);
    setDeleteStatus('idle');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#5C5346] font-sans selection:bg-[#C5A880] selection:text-white pb-20 relative overflow-x-hidden">
      
      {/* Sticky Header with Delete Mode Toggle */}
      <div className="flex items-center justify-between p-6 border-b border-[#EADCC9] bg-[#FDFBF7] sticky top-0 z-30">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#7D7261] hover:text-[#4A433A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invite
        </Link>
        
        <h1 className="font-serif text-xl text-[#4A433A] font-light tracking-wide hidden sm:block">Shared Gallery</h1>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setIsDeleteMode(!isDeleteMode);
              setSelectedKeys([]);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all rounded-sm border bg-[#FAF8F5] border-[#C5A880]/60 text-[#5C5346] hover:bg-[#C5A880] hover:text-white"
          >
            {isDeleteMode ? 'Cancel Selection' : 'Select for Delete'}
          </button>

          {isDeleteMode && selectedKeys.length > 0 && (
            <button 
              onClick={() => {
                setKeysToDelete(selectedKeys);
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-[10px] sm:text-xs rounded-sm border border-[#BE123C] text-[#BE123C] font-semibold uppercase tracking-[0.2em] hover:bg-[#BE123C] hover:text-white transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedKeys.length})
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Capture the Day</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Our Shared Gallery</h2>
          <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          <p className="text-[13px] text-[#7D7261] max-w-md mx-auto pt-4 leading-relaxed">
            Our story, seen through your eyes. Please upload your photos below to help us preserve every single moment of our special day.
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex justify-center">
          <label className={`inline-flex items-center gap-2.5 px-8 py-3.5 ${isUploading ? 'bg-[#BFB69A] cursor-not-allowed' : 'bg-[#C5A880] hover:bg-[#B3956D]'} text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm shadow-sm cursor-pointer transition-all`}>
            <Camera className="w-4 h-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload Moments'}</span>
            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/quicktime,video/x-m4v"
              onChange={handleMediaUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Progress Bar & Toasts */}
        {isUploading && (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#5C5346] mb-2">
              <span>Uploading your memories</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#EDE7DC] overflow-hidden border border-[#EADCC9]">
              <div className="h-full bg-[#C5A880] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {uploadError && <div className="flex justify-center text-sm text-[#BE185D]">{uploadError}</div>}
        {uploadToast && !isUploading && <div className="flex justify-center text-sm text-[#BE185D]">{uploadToast}</div>}

        {/* Gallery Grid with Delete Support */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {mediaGallery.map((media, idx) => {
            const safeKey = media.key || `gallery-item-${idx}`;
            const isSelected = selectedKeys.includes(safeKey);
            const isVideo = media.isVideo || /\.(mp4|mov|m4v|webm|avi|mkv)/i.test(media.url);

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
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && mediaGallery[lightboxIndex] && !isDeleteMode && (
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
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] border border-[#EADCC9] max-w-md w-full rounded-sm p-8 text-center shadow-2xl">
            <h3 className="font-serif text-2xl text-[#4A433A] mb-3">
              {deleteStatus === 'success' ? 'Deleted Successfully' : deleteStatus === 'error' ? 'Delete Failed' : 'Remove from Gallery?'}
            </h3>
            <p className="text-xs text-[#7D7261] mb-6 leading-relaxed">
              {deleteStatus === 'deleting' && 'Deleting your selected moments…'}
              {deleteStatus === 'success' && 'Your selected moments have been removed from the gallery.'}
              {deleteStatus === 'error' && 'Something went wrong while deleting. Please try again.'}
              {deleteStatus === 'idle' && `Are you sure you want to permanently delete ${keysToDelete.length} selected moment(s)?`}
            </p>
            
            <div className="flex gap-3 justify-center">
              {deleteStatus === 'idle' && (
                <>
                  <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="px-6 py-2.5 text-xs uppercase rounded-full border border-[#EADCC9] bg-white text-[#5C5346]">
                    Keep Selection
                  </button>
                  <button onClick={handleBatchDelete} disabled={isDeleting} className="px-7 py-2.5 text-xs uppercase rounded-full bg-[#9E1D3D] text-white">
                    {isDeleting ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                </>
              )}
              {deleteStatus === 'success' && (
                <button onClick={closeDeleteModal} className="px-7 py-2.5 text-xs uppercase rounded-full border border-[#BE123C] bg-[#FAF6F0] text-[#BE123C]">
                  Done
                </button>
              )}
              {deleteStatus === 'error' && (
                <button onClick={closeDeleteModal} className="px-6 py-2.5 text-xs uppercase rounded-full border border-[#EADCC9] bg-white">
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}