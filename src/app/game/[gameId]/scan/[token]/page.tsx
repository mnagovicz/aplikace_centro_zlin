"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const gameId = params.gameId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionToken = localStorage.getItem(`session_${gameId}`);
    const url = `/api/scan?token=${token}&session=${sessionToken || ""}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        switch (data.action) {
          case "register":
            // Store checkpoint info for after registration
            sessionStorage.setItem(
              "pendingCheckpoint",
              JSON.stringify({
                checkpointId: data.checkpointId,
                token,
              })
            );
            router.replace(`/game/${data.gameId}/register`);
            break;

          case "question":
            sessionStorage.setItem(
              "currentCheckpoint",
              JSON.stringify({
                checkpointId: data.checkpointId,
                checkpointName: data.checkpointName,
                question: data.question,
                answers: data.answers,
              })
            );
            router.replace(`/game/${data.gameId}/checkpoint`);
            break;

          case "already_answered":
            router.replace(`/game/${data.gameId}/progress`);
            break;

          case "completed":
            router.replace(`/game/${data.gameId}/complete`);
            break;

          default:
            setError("Neočekávaná odpověď serveru");
            setLoading(false);
        }
      })
      .catch(() => {
        setError("Nepodařilo se načíst data. Zkontrolujte připojení.");
        setLoading(false);
      });
  }, [token, gameId, router]);

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Ověřuji QR kód..." />;
  }

  return null;
}
