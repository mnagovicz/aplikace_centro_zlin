"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          name,
          email,
          gdprConsent,
          marketingConsent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Store session token
      localStorage.setItem(`session_${gameId}`, data.sessionToken);

      // Check if there's a pending checkpoint
      const pendingStr = sessionStorage.getItem("pendingCheckpoint");
      if (pendingStr) {
        const pending = JSON.parse(pendingStr);
        sessionStorage.removeItem("pendingCheckpoint");
        // Re-scan the token to get the question
        router.replace(`/game/${gameId}/scan/${pending.token}`);
      } else {
        router.replace(`/game/${gameId}/progress`);
      }
    } catch {
      setError("Něco se pokazilo. Zkuste to prosím znovu.");
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Registruji..." />;
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Registrace</h2>
      <p className="mb-6 text-sm text-gray-600">
        Pro účast v soutěži se prosím zaregistrujte.
      </p>

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Jméno a příjmení *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Jan Novák"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            E-mail *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="jan@email.cz"
          />
        </div>

        <div className="space-y-3 rounded-lg bg-gray-50 p-3">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">
              Souhlasím se zpracováním osobních údajů za účelem účasti v soutěži.
              *
            </span>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">
              Souhlasím se zasíláním marketingových sdělení OC Centro Zlín.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!gdprConsent}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Zaregistrovat se a hrát
        </button>
      </form>
    </div>
  );
}
