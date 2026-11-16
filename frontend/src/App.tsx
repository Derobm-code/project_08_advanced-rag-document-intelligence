import { useEffect, useState } from "react";
import axios from "axios";

import DocumentUpload from "./components/DocumentUpload";
import SemanticSearch from "./components/SemanticSearch";
import AskAI from "./components/AskAI";
import PDFViewer from "./components/PDFViewer";

type HealthResponse = {
  status: string;
  service: string;
};


const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export default function App() {
  const [status, setStatus] = useState("Connecting...");
  const [connected, setConnected] = useState(false);
  const [documentVersion, setDocumentVersion] = useState(0);
  const [currentDocument, setCurrentDocument] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);

  useEffect(() => {
    axios
      .get<HealthResponse>(`${API_URL}/api/health`)
      .then(({ data }) => {
        setConnected(data.status === "ok");
        setStatus(data.status === "ok" ? "Connected" : "Unavailable");
      })
      .catch(() => {
        setConnected(false);
        setStatus("Backend unavailable");
      });
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

function handleCitationClick(page: number) {
  setSelectedPage(page);

  document.getElementById("pdf-viewer")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

 return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#090d19] px-4 py-12 sm:px-6 md:py-20">
      <div className="relative mx-auto w-full max-w-5xl">

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center shadow-2xl md:px-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
            Project 08 · AI Engineering
          </p>

          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
            Advanced RAG
            <span className="block bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Document Intelligence
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-5xl leading-8 text-slate-400">
            Upload documents, explore their contents, and ask questions
            backed by verifiable source citations.
          </p>

          <div className="mx-auto mt-10 flex max-w-2xl items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-5 py-4 text-left">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${
                connected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />

            <span className="text-sm text-slate-300">
              Backend API: {status}
            </span>
          </div>
        </section>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03]">
          <DocumentUpload
            onUploadSuccess={(document, file) => {
              setCurrentDocument(document.filename);
              setPdfUrl(URL.createObjectURL(file));
              setSelectedPage(1);
              setDocumentVersion((version) => version + 1);
            }}
          />
        </div>

        {/* Current document indicator */}
        {currentDocument && (
        <p className="mt-5 text-center text-sm text-emerald-300">
          Currently indexed: {currentDocument}
        </p>
      )}

        {/* Search section */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] py-4">
          <SemanticSearch key={`search-${documentVersion}`} />
        </div>       
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03]">
            <AskAI 
            key={`ask-${documentVersion}`} 
            onCitationClick={handleCitationClick}
            />
          </div>

          {pdfUrl && (
            <div
            id="pdf-viewer"
            className="mt-10 scroll-mt-8 rounded-3xl border boder-white/10 bg-white/[0.03]"
          >
            <PDFViewer
            url={pdfUrl}
            filename={currentDocument}
            selectedPage= {selectedPage}
            onPageChange={setSelectedPage} 
            />
      </div>
    )}
    </div>
    </main>
  );
}
