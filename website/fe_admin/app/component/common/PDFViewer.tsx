import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Loader } from 'lucide-react';

// Lazy imports to avoid SSR issues
let Document: any;
let Page: any;
let pdfjs: any;

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Configure worker only in browser
if (isBrowser) {
  import('react-pdf').then((module) => {
    Document = module.Document;
    Page = module.Page;
    pdfjs = module.pdfjs;
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  });
  // Import CSS only in browser
  import('react-pdf/dist/Page/AnnotationLayer.css');
  import('react-pdf/dist/Page/TextLayer.css');
}

interface PDFViewerProps {
  fileUrl: string;
  onDownload?: () => void;
}

export default function PDFViewer({ fileUrl, onDownload }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Reset state when URL changes
    setPageNumber(1);
    setScale(1.0);
    setLoading(true);
    setError(null);
  }, [fileUrl]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setError('Không thể tải file PDF. Vui lòng thử lại.');
    setLoading(false);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1));
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }

  function zoomOut() {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }

  // Don't render on server side
  if (!isClient) {
    return (
      <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden items-center justify-center">
        <Loader size={48} className="animate-spin text-[#2F855A]" />
        <p className="text-gray-600 mt-3">Đang tải PDF viewer...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Trang trước"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
            Trang {pageNumber} / {numPages || '?'}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Trang sau"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Phóng to"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        {/* Download button */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 rounded-lg bg-[#2F855A] hover:bg-[#276749] text-white transition-colors flex items-center gap-2"
            title="Tải xuống"
          >
            <Download size={20} />
            <span className="text-sm font-medium hidden sm:inline">Tải xuống</span>
          </button>
        )}
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <Loader size={48} className="animate-spin text-[#2F855A]" />
            <p className="text-gray-600">Đang tải PDF...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-800 font-medium mb-2">Lỗi tải PDF</p>
            <p className="text-red-600 text-sm">{error}</p>
            {onDownload && (
              <button
                onClick={onDownload}
                className="mt-4 px-4 py-2 bg-[#2F855A] hover:bg-[#276749] text-white rounded-lg transition-colors"
              >
                Tải xuống thay thế
              </button>
            )}
          </div>
        )}

        {!error && Document && Page && (
          <div className="bg-white shadow-lg">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              error={null}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={null}
                error={null}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
