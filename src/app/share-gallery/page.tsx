"use client";
import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import GalleryHeader from '@/components/GalleryHeader';
import GalleryGrid from '@/components/GalleryGrid';
import LightboxModal from '@/components/LightboxModal';
import DeleteModal from '@/components/DeleteModal';
import UploadStatus from '@/components/UploadStatus';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useGalleryDelete } from '@/hooks/useGalleryDelete';
import { parseKeyTimestamp, isVideoFile } from '@/utils/galleryHelpers';

interface MediaItem {
  type?: string;
  url: string;
  key: string;
  isVideo?: boolean;
}

export default function ShareGalleryPage() {
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [_myUploadedKeys, setMyUploadedKeys] = useState<string[]>([]);

  const refreshGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      const publicBaseUrl = "https://pub-24a198c3bcd44e7ab19fd37353cb5c07.r2.dev";
      const rawImages = Array.isArray(data.images) ? data.images : [];

      const sortedImages = [...rawImages].sort((a, b) => parseKeyTimestamp(b) - parseKeyTimestamp(a));

      const itemsWithUrls = sortedImages.map((key: string) => {
        const isVideoFileFlag = isVideoFile(key);
        return {
          key,
          url: `${publicBaseUrl}/${key}`,
          type: isVideoFileFlag ? 'video/mp4' : 'image/jpeg',
          isVideo: isVideoFileFlag
        };
      });
      setMediaGallery(itemsWithUrls);
    } catch (err) {
      console.error("Failed to refresh gallery:", err);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("my_wedding_uploads");
    if (saved) setMyUploadedKeys(JSON.parse(saved));
    refreshGallery();
  }, []);

  const {
    isUploading,
    uploadProgress,
    uploadError,
    uploadToast,
    handleMediaUpload,
  } = useMediaUpload(refreshGallery);

  const {
    isDeleteMode,
    setIsDeleteMode,
    selectedKeys,
    setSelectedKeys,
    showDeleteModal,
    setShowDeleteModal,
    keysToDelete,
    setKeysToDelete,
    isDeleting,
    deleteStatus,
    deleteErrorMsg,
    toggleSelection,
    handleBatchDelete,
    closeDeleteModal,
  } = useGalleryDelete(_myUploadedKeys, setMyUploadedKeys, setMediaGallery);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#5C5346] font-sans selection:bg-[#C5A880] selection:text-white pb-20 relative overflow-x-hidden">
      
      {/* Sticky Header Component */}
      <GalleryHeader 
        isDeleteMode={isDeleteMode}
        setIsDeleteMode={setIsDeleteMode}
        setSelectedKeys={setSelectedKeys}
        selectedKeysCount={selectedKeys.length}
        onTriggerDeleteModal={() => {
          setKeysToDelete(selectedKeys);
          setShowDeleteModal(true);
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        
        {/* Section Heading */}
        <div className="text-center space-y-3">
          <span className="block pb-2 text-[15px] uppercase tracking-[0.4em] text-[#C5A880] font-bold">Capture the Day</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#4A433A] tracking-wide">Our Shared Gallery</h2>
          <div className="w-8 h-[1px] bg-[#C5A880] mx-auto mt-4" />
          <p className="text-[20px] text-[#7D7261] max-w-md mx-auto pt-4 leading-relaxed">
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
              onChange={(e) => handleMediaUpload(e, setMediaGallery, setMyUploadedKeys)}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>

        {/* Upload Progress & Status Component */}
        <UploadStatus 
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          uploadToast={uploadToast}
        />

        {/* Gallery Grid Component */}
        <GalleryGrid 
          mediaGallery={mediaGallery}
          isDeleteMode={isDeleteMode}
          selectedKeys={selectedKeys}
          toggleSelection={toggleSelection}
          setLightboxIndex={setLightboxIndex}
        />
      </div>

      {/* Lightbox Modal Component */}
      <LightboxModal 
        lightboxIndex={lightboxIndex}
        mediaGallery={mediaGallery}
        isDeleteMode={isDeleteMode}
        setLightboxIndex={setLightboxIndex}
      />

      {/* Delete Confirmation Modal Component */}
      <DeleteModal 
        showDeleteModal={showDeleteModal}
        deleteStatus={deleteStatus}
        keysToDeleteCount={keysToDelete.length}
        deleteErrorMsg={deleteErrorMsg}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirmDelete={handleBatchDelete}
      />

    </div>
  );
}
