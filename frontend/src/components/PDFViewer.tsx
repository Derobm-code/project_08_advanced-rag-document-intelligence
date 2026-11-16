import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

    type PDFViewerProps = {
        url: string;
        filename: string;
        selectedPage: number;
        onPageChange: (page: number) => void;
    };

    export default function PDFViewer({
        url, filename, selectedPage, onPageChange,}: PDFViewerProps) {
            const [numPages, setNumPages] = useState(0);
            const [error, setError] = useState("");

            function changePage(page: number) {
                if (page >= 1 && page <= numPages) {
                    onPageChange(page);
                }
            }

            return (
                <section className="w-full px-6 py-10">
                    <h2 className="text-2xl font-bold text-white">
                        PDF Viewer
                    </h2>

                    <p className="mt-2 break-all text-sm text-slate-400">
                        {filename}
                    </p>

                    {numPages > 0 && (
                        <div className="mt-6 flex flex-wrap items-center gap-4">
                            <button
                              type="button"
                              onClick={() => changePage(selectedPage - 1)}
                              disabled={selectedPage <= 1}
                              className="rounded-lg bg-biolet-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="text-sm text-slate-300">
                                Page {selectedPage} of {numPages}
                            </span>

                            <button
                            type="button"
                            onClick={() => changePage(selectedPage + 1)}
                            disabled={selectedPage >= numPages}
                            className="rounded-lg bg-violet-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {error && (
                        <p role="alert" className="mt-4 text-red-400">
                            {error}
                        </p>
                    )}

                    <div className="mt-6 overflow-auto rounded-xl bg-slate-800 p-4">
                        <Document key={url} file={url} onLoadSuccess={({ numPages: pages }) => {
                            setNumPages(pages);
                            setError("");
                        }}
                        onLoadError={() => {
                            setError("Unable to display this PDF.");
                        }}
                        loading={
                            <p className="text-slate-300">
                                Loading PDF...
                            </p>
                        }
                        >
                            <Page
                            pageNumber={
                                numPages > 0
                                ? Math.min(Math.max(selectedPage, 1), numPages)
                                : 1
                            }
                            width={650}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            />
                    </Document>
                    </div>
                </section>
            );
        }