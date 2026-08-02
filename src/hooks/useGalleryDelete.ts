import { useState } from 'react';

interface MediaItem {
  type?: string;
  url: string;
  key: string;
  isVideo?: boolean;
}

export function useGalleryDelete(
  _myUploadedKeys: string[],
  setMyUploadedKeys: React.Dispatch<React.SetStateAction<string[]>>,
  setMediaGallery: React.Dispatch<React.SetStateAction<MediaItem[]>>
) {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [keysToDelete, setKeysToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string>("");

  const toggleSelection = (key: string) => {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const handleBatchDelete = async () => {
    if (isDeleting) return;

    setDeleteErrorMsg("");

    const unauthorizedKeys = keysToDelete.filter((key) => !_myUploadedKeys.includes(key));
    if (unauthorizedKeys.length > 0) {
      setDeleteErrorMsg("You can only delete photos you've uploaded. If you've cleared your browser cache, your local upload history is reset.");
      return;
    }

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
      setDeleteErrorMsg("");
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
    setDeleteErrorMsg("");
  };

  return {
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
    setDeleteErrorMsg,
    toggleSelection,
    handleBatchDelete,
    closeDeleteModal,
  };
}