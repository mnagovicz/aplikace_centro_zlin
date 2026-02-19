"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function CompletePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [completionCode, setCompletionCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sessionToken = localStorage.getItem(`session_${gameId}`);
    if (!sessionToken) {
      setError("Session nenalezena");
      setLoading(false);
      return;
    }

    fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCompletionCode(data.completionCode);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Nepodařilo se dokončit hru");
        setLoading(false);
      });
  }, [gameId]);

  const handleCopy = async () => {
    if (!completionCode) return;
    try {
      await navigator.clipboard.writeText(completionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = completionCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Generuji kód odměny..." />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
        🎉
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        Gratulujeme!
      </h2>
      <p className="mb-6 text-sm text-gray-600">
        Úspěšně jste dokončili všechna stanoviště. Váš kód pro vyzvednutí
        odměny:
      </p>

      <div className="mb-4 rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-6">
        <p className="font-mono text-3xl font-bold tracking-widest text-green-800">
          {completionCode}
        </p>
      </div>

      <button
        onClick={handleCopy}
        className="mb-6 inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
      >
        {copied ? "Zkopírováno!" : "Kopírovat kód"}
      </button>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          Ukažte tento kód na informačním pultu OC Centro Zlín pro vyzvednutí
          odměny. Kód byl také odeslán na váš e-mail.
        </p>
      </div>
    </div>
  );
}
