import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';

if (typeof window !== 'undefined' && 'Worker' in window) {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${GlobalWorkerOptions.workerSrc}/pdf.worker.min.js`;
}
