"use client";

interface DeleteModalProps {
  showDeleteModal: boolean;
  deleteStatus: 'idle' | 'deleting' | 'success' | 'error';
  keysToDeleteCount: number;
  deleteErrorMsg: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
}

export default function DeleteModal({
  showDeleteModal,
  deleteStatus,
  keysToDeleteCount,
  deleteErrorMsg,
  isDeleting,
  onClose,
  onConfirmDelete,
}: DeleteModalProps) {
  if (!showDeleteModal) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-[#FDFBF7] border border-[#EADCC9] max-w-md w-full rounded-sm p-8 text-center shadow-2xl">
        
        {/* Close (X) Button in Top Right Corner */}
        <button 
          onClick={onClose} 
          disabled={isDeleting}
          className="absolute top-3 right-3 text-[#7D7261] hover:text-[#4A433A] p-1 rounded-full transition"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="font-serif text-2xl text-[#4A433A] mb-3">
          {deleteStatus === 'success' ? 'Deleted Successfully' : deleteStatus === 'error' ? 'Delete Failed' : 'Remove from Gallery?'}
        </h3>
        <p className="text-xs text-[#7D7261] mb-4 leading-relaxed">
          {deleteStatus === 'deleting' && 'Deleting your selected moments…'}
          {deleteStatus === 'success' && 'Your selected moments have been removed from the gallery.'}
          {deleteStatus === 'error' && 'Something went wrong while deleting. Please try again.'}
          {deleteStatus === 'idle' && `Are you sure you want to permanently delete ${keysToDeleteCount} selected moment(s)?`}
        </p>
        
        {deleteErrorMsg && (
          <p className="text-xs text-[#9E1D3D] mb-6 leading-relaxed font-medium bg-[#FAF6F0] p-3 rounded border border-[#EADCC9]">
            {deleteErrorMsg}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          {deleteStatus === 'idle' && (
            <>
              <button onClick={onClose} disabled={isDeleting} className="px-6 py-2.5 text-xs uppercase rounded-full border border-[#EADCC9] bg-white text-[#5C5346]">
                Keep Selection
              </button>
              <button onClick={onConfirmDelete} disabled={isDeleting} className="px-7 py-2.5 text-xs uppercase rounded-full bg-[#9E1D3D] text-white">
                {isDeleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </>
          )}
          {deleteStatus === 'success' && (
            <button onClick={onClose} className="px-7 py-2.5 text-xs uppercase rounded-full border border-[#BE123C] bg-[#FAF6F0] text-[#BE123C]">
              Done
            </button>
          )}
          {deleteStatus === 'error' && (
            <button onClick={onClose} className="px-6 py-2.5 text-xs uppercase rounded-full border border-[#EADCC9] bg-white">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}