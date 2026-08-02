"use client";

interface UploadStatusProps {
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string;
  uploadToast: string;
}

export default function UploadStatus({
  isUploading,
  uploadProgress,
  uploadError,
  uploadToast,
}: UploadStatusProps) {
  return (
    <>
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
    </>
  );
}