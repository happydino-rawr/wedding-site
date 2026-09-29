"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface GalleryHeaderProps {
  isDeleteMode: boolean;
  setIsDeleteMode: (val: boolean) => void;
  setSelectedKeys: React.Dispatch<React.SetStateAction<string[]>>;
  selectedKeysCount: number;
  onTriggerDeleteModal: () => void;
}

export default function GalleryHeader({
  isDeleteMode,
  setIsDeleteMode,
  setSelectedKeys,
  selectedKeysCount,
  onTriggerDeleteModal,
}: GalleryHeaderProps) {
  return (
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
          className="inline-flex items-center gap-2 px-4 py-2 text-[15px] sm:text-xs uppercase tracking-[0.2em] transition-all rounded-sm border bg-[#FAF8F5] border-[#C5A880]/60 text-[#5C5346] hover:bg-[#C5A880] hover:text-white"
        >
          {isDeleteMode ? 'Cancel Selection' : 'Select for Delete'}
        </button>

        {isDeleteMode && selectedKeysCount > 0 && (
          <button 
            onClick={onTriggerDeleteModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-[15px] sm:text-xs rounded-sm border border-[#BE123C] text-[#BE123C] font-semibold uppercase tracking-[0.2em] hover:bg-[#BE123C] hover:text-white transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Delete ({selectedKeysCount})
          </button>
        )}
      </div>
    </div>
  );
}