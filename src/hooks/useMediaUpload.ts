import { useState } from 'react';

interface MediaItem {
  type?: string;
  url: string;
  key: string;
  isVideo?: boolean;
}

export function useMediaUpload(onUploadComplete: () => Promise<void>) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>("");
  const [uploadToast, setUploadToast] = useState<string>("");

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setMediaGallery: React.Dispatch<React.SetStateAction<MediaItem[]>>,
    setMyUploadedKeys: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
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

    await onUploadComplete();
    setIsUploading(false);
    setUploadProgress(0);
    setUploadToast("Uploads complete! Your new photos are now in the gallery.");
    e.target.value = "";
  };

  return {
    isUploading,
    uploadProgress,
    uploadError,
    uploadToast,
    handleMediaUpload,
  };
}