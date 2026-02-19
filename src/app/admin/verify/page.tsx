"use client";

import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";

interface VerifyResult {
  valid: boolean;
  playerName: string;
  playerEmail: string;
  gameName: string;
  rewardDescription: string;
  completedAt: string;
}

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Nepodařilo se ověřit kód");
    }
    setLoading(false);
  };

  return (
    <AdminLayout role="staff">
      <div className="mx-auto max-w-md">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Ověření kódu odměny
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Zadejte kód, který vám hráč ukáže pro vyzvednutí odměny.
        </p>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-lg uppercase tracking-widest text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!code.trim() || loading}
              className="whitespace-nowrap rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Ověřit
            </button>
          </div>
        </form>

        {loading && <LoadingSpinner text="Ověřuji..." />}

        {error && <ErrorMessage message={error} />}

        {result && (
          <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <h3 className="text-lg font-bold text-green-800">Platný kód</h3>
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-green-700">Hráč:</dt>
                <dd className="font-medium text-green-900">
                  {result.playerName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-green-700">E-mail:</dt>
                <dd className="text-green-900">{result.playerEmail}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-green-700">Hra:</dt>
                <dd className="text-green-900">{result.gameName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-green-700">Odměna:</dt>
                <dd className="font-medium text-green-900">
                  {result.rewardDescription || "Neuvedena"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-green-700">Dokončeno:</dt>
                <dd className="text-green-900">
                  {new Date(result.completedAt).toLocaleString("cs-CZ")}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
