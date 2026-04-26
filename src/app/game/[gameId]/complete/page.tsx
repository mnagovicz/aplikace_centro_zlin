"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function CompletePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [completionCode, setCompletionCode] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<{
    playerCorrect: number;
    bestScore: number;
    totalCheckpoints: number;
    playerRank: number;
    totalPlayers: number;
  } | null>(null);
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
          if (data.qrDataUrl) {
            setQrDataUrl(data.qrDataUrl);
          }
          if (data.leaderboard) {
            setLeaderboard(data.leaderboard);
          }
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

      {qrDataUrl && (
        <div className="mb-4">
          <p className="mb-2 text-xs text-gray-500">QR kód pro rychlé ověření:</p>
          <img
            src={qrDataUrl}
            alt="QR kód pro ověření odměny"
            className="mx-auto h-48 w-48"
          />
        </div>
      )}

      <button
        onClick={handleCopy}
        className="mb-6 inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
      >
        {copied ? "Zkopírováno!" : "Kopírovat kód"}
      </button>

      {leaderboard && (
        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h3 className="mb-3 text-sm font-bold text-purple-900">
            Vaše výsledky
          </h3>
          <div className="mb-3 space-y-2">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-purple-700">Vaše správné odpovědi</span>
                <span className="font-semibold text-purple-900">
                  {leaderboard.playerCorrect}/{leaderboard.totalCheckpoints}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-purple-200">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (leaderboard.playerCorrect / leaderboard.totalCheckpoints) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-purple-700">Nejlepší hráč</span>
                <span className="font-semibold text-purple-900">
                  {leaderboard.bestScore}/{leaderboard.totalCheckpoints}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-purple-200">
                <div
                  className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      (leaderboard.bestScore / leaderboard.totalCheckpoints) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <p className="text-center text-sm font-medium text-purple-800">
            {leaderboard.playerCorrect >= leaderboard.bestScore
              ? "Překonali jste nejlepšího hráče!"
              : `Umístili jste se na ${leaderboard.playerRank}. místě z ${leaderboard.totalPlayers} hráčů`}
          </p>
        </div>
      )}

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          Ukažte tento kód na informačním pultu OC Centro Zlín pro vyzvednutí
          odměny. Kód byl také odeslán na váš e-mail.
        </p>
      </div>
    </div>
  );
}
