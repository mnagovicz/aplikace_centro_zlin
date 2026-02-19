"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import ProgressBar from "@/components/ProgressBar";

interface CheckpointStatus {
  id: string;
  name: string;
  answered: boolean;
  answeredCorrectly?: boolean;
}

export default function ProgressPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [checkpoints, setCheckpoints] = useState<CheckpointStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCompleted, setAllCompleted] = useState(false);

  useEffect(() => {
    const sessionToken = localStorage.getItem(`session_${gameId}`);
    if (!sessionToken) {
      router.replace(`/game/${gameId}/register`);
      return;
    }

    fetch(`/api/progress?session=${sessionToken}&gameId=${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        if (data.completionCode) {
          router.replace(`/game/${gameId}/complete`);
          return;
        }

        const statuses: CheckpointStatus[] = data.checkpoints || [];
        setCheckpoints(statuses);

        const completed =
          statuses.length > 0 && statuses.every((s) => s.answered);
        setAllCompleted(completed);
        setLoading(false);
      })
      .catch(() => {
        setError("Nepodařilo se načíst průběh hry");
        setLoading(false);
      });
  }, [gameId, router]);

  const handleComplete = () => {
    router.push(`/game/${gameId}/complete`);
  };

  if (loading) {
    return <LoadingSpinner text="Načítám průběh..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const answered = checkpoints.filter((c) => c.answered).length;

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Váš průběh</h2>
      <p className="mb-6 text-sm text-gray-600">
        Skenujte QR kódy na stanovištích a odpovídejte na otázky.
      </p>

      <div className="mb-6">
        <ProgressBar
          current={answered}
          total={checkpoints.length}
          label="Splněná stanoviště"
        />
      </div>

      <div className="mb-6 space-y-2">
        {checkpoints.map((cp, index) => (
          <div
            key={cp.id}
            className={`flex items-center gap-3 rounded-lg border p-3 ${
              cp.answered
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                cp.answered
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {cp.answered ? "\u2713" : index + 1}
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  cp.answered ? "text-green-800" : "text-gray-700"
                }`}
              >
                {cp.name}
              </p>
              {cp.answered && (
                <p className="text-xs text-green-600">Splněno</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {allCompleted && (
        <button
          onClick={handleComplete}
          className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
        >
          Vyzvednout odměnu
        </button>
      )}

      {!allCompleted && (
        <p className="text-center text-sm text-gray-500">
          Najděte další QR kód v obchodním centru a naskenujte ho.
        </p>
      )}
    </div>
  );
}
