import { useState } from "react";
import axios from "axios";

type SearchResult = {
    document_id: string;
    filename: string;
    page: number;
    text: string;
    score: number;
};

type SearchResponse = {
    query: string;
    total_results: number;
    results: SearchResult[];
};

const API_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export default function SemanticSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const[loading, setLoading] = useState(false);
    const[error, setError] = useState("");

    async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!query.trim()) return;

        setLoading(true);
        setError("");
        setResults([]);

        try {
            const { data } = await axios.post<SearchResponse>(
                `${API_URL}/api/search`,
                {
                    query: query.trim(),
                    limit: 5,
                }
            );

            setResults(data.results);
        } catch (err) {
            console.error(err);
            setError("Search failed. Check your backend connection.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="mx-auto w-full max-w-4xl px-6 py-12">
            <h2 className="text-2xl font-bold text-white">
                Semantic Document Search
            </h2>

            <p className="mt-2 text-slate-400">
                Search your uploaded PDFs using natural languages
            </p>

            <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask something about your documents..."
                    minLength={2}
                    maxLength={1000}
                    required
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-violet-400"
                    />

                    <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                    >
                        {loading ? "Searching..." : "Search"}
                    </button>
            </form>

            {error && (
                <p role="alert" className="mt-5 text-red-400">
                    {error}
                </p>
            )}

            {!loading && results.length === 0 && !error && (
                <p className="mt-8 text-sm text-slate-500">
                    Search results will appear here
                </p>
            )}

            <div className="mt-8 space-y-4">
                {results.map((result, index) => (
                    <article
                    key={`${result.document_id}-${result.page}-${index}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-semibold text-violet-300">
                                {result.filename} · Page {result.page}
                            </h3>

                            <span className="text-xs text-slate-400">
                                Similarity: {result.score.toFixed(3)}
                            </span>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">
                            {result.text}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}