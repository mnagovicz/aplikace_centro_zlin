"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Game } from "@/lib/types";

export default function DashboardPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/games")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setGames(data.games);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Nepodařilo se načíst hry");
        setLoading(false);
      });
  }, []);

  const toggleActive = async (game: Game) => {
    const res = await fetch("/api/admin/games", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: game.id, isActive: !game.is_active }),
    });
    const data = await res.json();
    if (data.game) {
      setGames((prev) =>
        prev.map((g) => (g.id === game.id ? data.game : g))
      );
    }
  };

  const deleteGame = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tuto hru? Tato akce je nevratná.")) return;

    const res = await fetch(`/api/admin/games?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setGames((prev) => prev.filter((g) => g.id !== id));
    }
  };

  return (
    <AdminLayout role="superadmin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Přehled her</h2>
        <Link
          href="/admin/games/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Nová hra
        </Link>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && games.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          Zatím nemáte žádné hry.
        </p>
      )}

      <div className="space-y-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {game.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      game.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {game.is_active ? "Aktivní" : "Neaktivní"}
                  </span>
                </div>
                {game.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {game.description}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/admin/games/${game.id}/edit`}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Upravit
              </Link>
              <Link
                href={`/admin/games/${game.id}/checkpoints`}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Stanoviště
              </Link>
              <Link
                href={`/admin/games/${game.id}/players`}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Hráči
              </Link>
              <button
                onClick={() => toggleActive(game)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  game.is_active
                    ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {game.is_active ? "Deaktivovat" : "Aktivovat"}
              </button>
              <button
                onClick={() => deleteGame(game.id)}
                className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                Smazat
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
