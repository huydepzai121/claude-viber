import { ChevronLeft, ChevronRight, ExternalLink, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useFilePreview } from '@/contexts/FilePreviewContext';
import { useTranslation } from '@/i18n/context';
import { getPreviewType } from '@/utils/filePreview';
import type { PreviewType } from '@/utils/filePreview';

interface PreviewState {
  type: PreviewType;
  isLoading: boolean;
  error: string | null;
  // For images / code / html
  content: string | null;
  mimeType: string | null;
  // For PPTX multi-page
  pages: { data: string; mimeType: string }[];
  currentPage: number;
}

const INITIAL_STATE: PreviewState = {
  type: 'unsupported',
  isLoading: false,
  error: null,
  content: null,
  mimeType: null,
  pages: [],
  currentPage: 0
};

// PLACEHOLDER_COMPONENT

export default function FilePreviewPanel() {
  const { isOpen, previewPath, closePreview } = useFilePreview();
  const { t } = useTranslation();
  const [state, setState] = useState<PreviewState>(INITIAL_STATE);

  const fileName = previewPath ? (previewPath.split('/').pop() ?? previewPath) : '';

  const loadPreview = useCallback(async (filePath: string) => {
    const type = getPreviewType(filePath);
    setState({ ...INITIAL_STATE, type, isLoading: true });

    try {
      switch (type) {
        case 'image': {
          const result = await window.electron.file.readBinaryBase64(filePath);
          if (result.error) {
            setState((s) => ({ ...s, isLoading: false, error: result.error }));
          } else {
            setState((s) => ({
              ...s,
              isLoading: false,
              content: `data:${result.mimeType};base64,${result.data}`,
              mimeType: result.mimeType
            }));
          }
          break;
        }
        case 'pdf': {
          const result = await window.electron.file.readBinaryBase64(filePath);
          if (result.error) {
            setState((s) => ({ ...s, isLoading: false, error: result.error }));
          } else {
            setState((s) => ({
              ...s,
              isLoading: false,
              content: `data:application/pdf;base64,${result.data}`,
              mimeType: 'application/pdf'
            }));
          }
          break;
        }
        case 'pptx': {
          const result = await window.electron.file.convertToImages(filePath);
          if (result.error) {
            setState((s) => ({ ...s, isLoading: false, error: result.error }));
          } else {
            setState((s) => ({
              ...s,
              isLoading: false,
              pages: result.pages,
              currentPage: 0
            }));
          }
          break;
        }
        case 'html':
        case 'code': {
          const result = await window.electron.file.readText(filePath);
          if (result.error) {
            setState((s) => ({ ...s, isLoading: false, error: result.error }));
          } else {
            setState((s) => ({ ...s, isLoading: false, content: result.content }));
          }
          break;
        }
        default:
          setState((s) => ({ ...s, isLoading: false }));
      }
    } catch (error) {
      setState((s) => ({ ...s, isLoading: false, error: String(error) }));
    }
  }, []);

  useEffect(() => {
    if (previewPath && isOpen) {
      loadPreview(previewPath);
    } else {
      setState(INITIAL_STATE);
    }
  }, [previewPath, isOpen, loadPreview]);

  const handleOpenInApp = () => {
    if (previewPath) {
      window.electron.file.openInDefaultApp(previewPath).catch(() => {});
    }
  };

  const handlePrevPage = () => {
    setState((s) => ({ ...s, currentPage: Math.max(0, s.currentPage - 1) }));
  };

  const handleNextPage = () => {
    setState((s) => ({
      ...s,
      currentPage: Math.min(s.pages.length - 1, s.currentPage + 1)
    }));
  };

  // PLACEHOLDER_RENDER

  const renderContent = () => {
    if (state.isLoading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
        </div>
      );
    }

    if (state.error) {
      const isLibreoffice = state.error === 'libreoffice_not_found';
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            {isLibreoffice ? t('filePreview.libreofficeNotFound') : t('filePreview.error')}
          </p>
          <button
            onClick={handleOpenInApp}
            className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-raised)]"
          >
            <ExternalLink className="h-4 w-4" />
            {t('filePreview.openInAppFallback')}
          </button>
        </div>
      );
    }

    switch (state.type) {
      case 'image':
        return state.content ?
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <img
                src={state.content}
                alt={fileName}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          : null;

      case 'pdf':
        return state.content ?
            <iframe src={state.content} className="flex-1 border-0" title={fileName} />
          : null;

      case 'pptx':
        if (state.pages.length === 0) return null;
        return (
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              <img
                src={`data:${state.pages[state.currentPage].mimeType};base64,${state.pages[state.currentPage].data}`}
                alt={`Page ${state.currentPage + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {state.pages.length > 1 && (
              <div className="flex items-center justify-center gap-3 border-t border-[var(--border-subtle)] px-4 py-2">
                <button
                  onClick={handlePrevPage}
                  disabled={state.currentPage === 0}
                  className="rounded p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-[var(--text-muted)]">
                  {t('filePreview.page', {
                    current: state.currentPage + 1,
                    total: state.pages.length
                  })}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={state.currentPage === state.pages.length - 1}
                  className="rounded p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        );

      case 'html':
        return state.content ?
            <iframe
              srcDoc={state.content}
              className="flex-1 border-0 bg-white"
              title={fileName}
              sandbox="allow-scripts"
            />
          : null;

      case 'code':
        return state.content ?
            <pre className="flex-1 overflow-auto p-4 font-mono text-sm whitespace-pre-wrap text-[var(--text-secondary)]">
              {state.content}
            </pre>
          : null;

      default:
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <p className="text-sm text-[var(--text-muted)]">{t('filePreview.unsupported')}</p>
            <button
              onClick={handleOpenInApp}
              className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-raised)]"
            >
              <ExternalLink className="h-4 w-4" />
              {t('filePreview.openInApp')}
            </button>
          </div>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={closePreview} aria-hidden="true" />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-[480px] flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-[0_0_40px_rgba(0,0,0,0.4)] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-[var(--text-primary)]">{fileName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInApp}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
              title={t('filePreview.openInApp')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={closePreview}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
              title={t('filePreview.close')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </>
  );
}
