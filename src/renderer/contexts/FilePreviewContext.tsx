import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface FilePreviewContextValue {
  openPreview: (filePath: string) => void;
  closePreview: () => void;
  previewPath: string | null;
  isOpen: boolean;
}

const FilePreviewContext = createContext<FilePreviewContextValue | null>(null);

export function FilePreviewProvider({ children }: { children: ReactNode }) {
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openPreview = useCallback((filePath: string) => {
    setPreviewPath(filePath);
    setIsOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsOpen(false);
    // Delay clearing path so close animation can play
    setTimeout(() => setPreviewPath(null), 300);
  }, []);

  return (
    <FilePreviewContext value={{ openPreview, closePreview, previewPath, isOpen }}>
      {children}
    </FilePreviewContext>
  );
}

export function useFilePreview(): FilePreviewContextValue {
  const ctx = useContext(FilePreviewContext);
  if (!ctx) {
    throw new Error('useFilePreview must be used within a FilePreviewProvider');
  }
  return ctx;
}
