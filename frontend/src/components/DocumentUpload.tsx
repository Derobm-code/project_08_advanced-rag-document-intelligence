import { useRef, useState } from "react";
import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadResponse = {
  document_id: string;
  filename: string;
  pages_processed: number;
  chunks_stored: number;
  status: string;
};

type DocumentUploadProps = {
  onUploadSuccess: (document: UploadResponse, file: File) => void;
};

export default function DocumentUpload({
  onUploadSuccess,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState<UploadResponse | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    setError("");
    setUploaded(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("PDF must be smaller than 10 MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file || uploading) return;

    setUploading(true);
    setError("");

    const selectedFile = file;
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const { data } = await axios.post<UploadResponse>(
        `${API_URL}/api/documents/upload`,
        formData
      );

      setUploaded(data);
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      // Notify App.tsx that the indexed document changed.
      onUploadSuccess(data, selectedFile);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Upload failed. Check the backend."
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="w-full px-6 py-10">
      <h2 className="text-2xl font-bold text-white">
        Upload PDF Document
      </h2>

      <p className="mt-2 text-slate-400">
        Upload a PDF to index its contents. Each successful
        upload replaces the previously indexed document.
      </p>

      <div className="mt-7 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-violet-500"
        />

        {file && (
          <p className="mt-4 text-sm text-slate-300">
            Selected: {file.name}
          </p>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Processing PDF..." : "Upload & Index PDF"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {error}
        </p>
      )}

      {uploaded && (
        <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <p className="font-semibold text-emerald-300">
            PDF indexed successfully
          </p>

          <p className="mt-2 text-sm text-slate-300">
            Document: {uploaded.filename}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Pages processed: {uploaded.pages_processed}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Chunks stored: {uploaded.chunks_stored}
          </p>
        </div>
      )}
    </section>
  );
}
