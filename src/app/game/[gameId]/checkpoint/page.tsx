"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

const QrScanner = dynamic(() => import("@/components/QrScanner"), {
  ssr: false,
});

interface CheckpointData {
  checkpointId: string;
  checkpointName: string;
  question: string;
  answers: string[];
  checkpointImageUrl?: string | null;
}

export default function CheckpointPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [checkpoint, setCheckpoint] = useState<CheckpointData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    correctAnswer: string;
    allCompleted: boolean;
    answeredCheckpoints: number;
    totalCheckpoints: number;
    canRetry: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleQrScan = useCallback(
    (url: string) => {
      setShowScanner(false);
      // Extract token from scanned URL
      const match = url.match(/\/scan\/([^/?]+)/);
      if (match) {
        router.push(`/game/${gameId}/scan/${match[1]}`);
      } else if (url.startsWith("http")) {
        window.location.href = url;
      }
    },
    [gameId, router]
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("currentCheckpoint");
    if (stored) {
      setCheckpoint(JSON.parse(stored));
    } else {
      router.replace(`/game/${gameId}/progress`);
    }
  }, [gameId, router]);

  const handleSubmit = async () => {
    if (selectedAnswer === null || !checkpoint) return;

    setLoading(true);
    setError(null);

    const sessionToken = localStorage.getItem(`session_${gameId}`);

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          checkpointId: checkpoint.checkpointId,
          answerIndex: selectedAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setResult({
        correct: data.correct,
        correctAnswer: data.correctAnswer,
        allCompleted: data.allCompleted,
        answeredCheckpoints: data.answeredCheckpoints,
        totalCheckpoints: data.totalCheckpoints,
        canRetry: data.canRetry || false,
      });
      if (!data.canRetry) {
        sessionStorage.removeItem("currentCheckpoint");
      }
    } catch {
      setError("Nepodařilo se odeslat odpověď");
    }
    setLoading(false);
  };

  const handleContinue = () => {
    if (result?.allCompleted) {
      router.push(`/game/${gameId}/complete`);
    } else {
      router.push(`/game/${gameId}/progress`);
    }
  };

  if (!checkpoint) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return <LoadingSpinner text="Odesílám odpověď..." />;
  }

  // Show result
  if (result) {
    const remaining = result.totalCheckpoints - result.answeredCheckpoints;

    return (
      <div className="text-center">
        <div
          className={`mb-4 rounded-full inline-flex h-16 w-16 items-center justify-center text-3xl ${
            result.correct ? "bg-green-100" : "bg-orange-100"
          }`}
        >
          {result.correct ? "✓" : "✗"}
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          {result.correct ? "Správně!" : "Bohužel špatně"}
        </h2>
        {!result.correct && !result.canRetry && (
          <p className="mb-4 text-sm text-gray-600">
            Správná odpověď: <strong>{result.correctAnswer}</strong>
          </p>
        )}
        {result.canRetry && (
          <p className="mb-4 text-sm text-orange-600 font-medium">
            Pro splnění stanoviště musíte odpovědět správně. Zkuste to znovu!
          </p>
        )}

        {/* Progress feedback */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${Math.round(
                  (result.answeredCheckpoints / result.totalCheckpoints) * 100
                )}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-700">
            {result.allCompleted ? (
              <span className="font-semibold text-green-700">
                Všechna stanoviště splněna!
              </span>
            ) : (
              <>
                Splněno{" "}
                <strong>
                  {result.answeredCheckpoints} z {result.totalCheckpoints}
                </strong>{" "}
                stanovišť.{" "}
                {remaining === 1
                  ? "Zbývá 1 stanoviště."
                  : remaining <= 4
                    ? `Zbývají ${remaining} stanoviště.`
                    : `Zbývá ${remaining} stanovišť.`}
              </>
            )}
          </p>
        </div>

        {result.canRetry ? (
          <button
            onClick={() => {
              setResult(null);
              setSelectedAnswer(null);
            }}
            className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
          >
            Zkusit znovu
          </button>
        ) : result.allCompleted ? (
          <button
            onClick={handleContinue}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
          >
            Dokončit hru
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setShowScanner(true)}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Pokračovat — načíst další QR kód
            </button>
            <button
              onClick={handleContinue}
              className="w-full rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Zobrazit průběh
            </button>
          </div>
        )}
        {showScanner && (
          <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
        )}
      </div>
    );
  }

  // Show question
  return (
    <div>
      {checkpoint.checkpointImageUrl && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img
            src={checkpoint.checkpointImageUrl}
            alt={checkpoint.checkpointName}
            className="h-40 w-full object-cover"
          />
        </div>
      )}

      <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2">
        <p className="text-xs font-medium text-blue-700">
          {checkpoint.checkpointName}
        </p>
      </div>

      <h2 className="mb-6 text-lg font-bold text-gray-900">
        {checkpoint.question}
      </h2>

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <div className="mb-6 space-y-3">
        {checkpoint.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(index)}
            className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
              selectedAnswer === index
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {answer}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedAnswer === null}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Odpovědět
      </button>
    </div>
  );
}
