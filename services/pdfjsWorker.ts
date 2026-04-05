import { GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/** PDF.js worker tek kaynakta — pdfService ve SourceViewerModal aynı bundle’ı kullanır. */
GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
