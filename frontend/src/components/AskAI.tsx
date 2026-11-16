import { useState } from "react";
import axios from "axios";

type Citation = {
    reference: string;
    filename: string;
    page: number;
    text: string;
    score: number;
};

type AskResponse = {
    question: string;
    answer: string;
    citations: Citation[];
};

type AskAIProps = {
    onCitationClick?: (page: number) => void;
};

const API_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export default function AskAI({onCitationClick,}: AskAIProps) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [citations, setCitations] = useState<Citation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleAsk(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const trimmedQuestion = question.trim();

        if (trimmedQuestion.length < 2 || loading) return;

        setLoading(true);
        setError("");
        setAnswer("");
        setCitations([]);

        try {
            const { data } = await axios.post<AskResponse>(
                `${API_URL}/api/ask`,
                {
                    question: question.trim(),
                    limit: 5,
                }
            );

            setAnswer(data.answer);
            setCitations(data.citations ?? []);
        } catch (err) {
            console.error(err);

            if (axios.isAxiosError(err)) {
              setError(
                err.response?.data?.detail ||
                    "Unable to generate an answer. Check the backend."
              );
            } else {
              setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="w-full px-6 py-10">
            <h2 className="text-2xl font-bold text-white">
                Ask AI about Your Document
            </h2>

            <p className="mt-2 text-slate-400">
                Get answers grounded in the latest indexed PDF.
            </p>

            <form onSubmit={handleAsk} className="mt-7 space-y-4">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to know?"
                  minLength={2}
                  maxLength={1000}
                  required
                  rows={3}
                  className="w-full resize-y rounded-xl border border-white/15 bg-white/5 p-4 text-white outline-none focus:border-violet-400"
                  />

                  <button
                  type="submit"
                  disabled={loading || question.trim().length < 2}
                  className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    {loading ? "Generating answer..." : "Ask AI"}
                  </button>
            </form>

            {error && (
                <p role="alert" className="mt-5 text-red-400">
                    {error}
                </p>
            )}

            {answer && (
                <div className="mt-8 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
                    <h3 className="font-semibold text-violet-300">
                        AI Answer
                    </h3>
                    <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-200">
                        {answer}
                    </p>
                </div>
            )}

            {citations.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-white">
                        Supporting Sources
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                        Click a page number to open that page in the PDF viewer.
                    </p>

                    <div className="mt-4 space-y-3">
                        {citations.map((citation, index) => (
                          <details
                            key={`${citation.reference}-${index}`}
                            className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                          >
                            <summary className="cursor-pointer text-sm font-medium text-bilet-300">
                              {citation.reference} {citation.filename} - Page{" "}
                              {citation.page}
                            </summary>

                            <button 
                            type="button"
                            onClick={() => onCitationClick?.(citation.page)}
                            className="mt-3 rounded-lg border border-violet-400/30 px-3 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-400/10"
                            >
                                View page {citation.page} in PDF
                            </button>

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">
                              {citation.text}
                            </p>

                            <p className="mt-3 text-xs text-slate-500">
                              Retrieval score: {citation.score.toFixed(3)}
                            </p>
                            </details>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}