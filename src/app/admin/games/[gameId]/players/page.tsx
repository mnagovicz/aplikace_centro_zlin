"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

interface PlayerWithProgress {
  id: string;
  name: string;
  email: string;
  created_at: string;
  completion_code: string | null;
  completed_at: string | null;
  redeemed_at: string | null;
  marketing_consent: boolean;
  player_checkpoints: { checkpoint_id: string; answered_correctly: boolean }[];
}

export default function PlayersPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [players, setPlayers] = useState<PlayerWithProgress[]>([]);
  const [totalCheckpoints, setTotalCheckpoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/players?gameId=${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPlayers(data.players);
          setTotalCheckpoints(data.totalCheckpoints);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Nepodařilo se načíst hráče");
        setLoading(false);
      });
  }, [gameId]);

  const downloadCsv = () => {
    window.open(`/api/admin/players?gameId=${gameId}&format=csv`, "_blank");
  };

  return (
    <AdminLayout role="superadmin">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hráči</h2>
          <p className="text-sm text-gray-500">
            Celkem: {players.length} hráčů
          </p>
        </div>
        {players.length > 0 && (
          <button
            onClick={downloadCsv}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Export CSV
          </button>
        )}
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && players.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          Zatím se nezaregistroval žádný hráč.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Jméno</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Průběh</th>
              <th className="px-3 py-2">Kód</th>
              <th className="px-3 py-2">Odměna</th>
              <th className="px-3 py-2">Registrace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((p) => {
              const answered = p.player_checkpoints?.length || 0;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{p.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.completion_code
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {answered}/{totalCheckpoints}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">
                    {p.completion_code || "-"}
                  </td>
                  <td className="px-3 py-2">
                    {p.redeemed_at ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Vydána
                      </span>
                    ) : p.completion_code ? (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        Nevydána
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {new Date(p.created_at).toLocaleString("cs-CZ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
