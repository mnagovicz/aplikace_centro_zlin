"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Game } from "@/lib/types";

export default function EditGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [requireCorrectAnswer, setRequireCorrectAnswer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/games")
      .then((res) => res.json())
      .then((data) => {
        const found = data.games?.find((g: Game) => g.id === gameId);
        if (found) {
          setGame(found);
          setName(found.name);
          setDescription(found.description || "");
          setRewardDescription(found.reward_description || "");
          setPrimaryColor(found.primary_color || "");
          setBackgroundColor(found.background_color || "");
          setImageUrl(found.image_url || "");
          setRequireCorrectAnswer(found.require_correct_answer ?? true);
        } else {
          setError("Hra nenalezena");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Nepodařilo se načíst hru");
        setLoading(false);
      });
  }, [gameId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `games/${gameId}`);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setImageUrl(data.url);
      }
    } catch {
      setError("Nepodařilo se nahrát obrázek");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/games", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: gameId,
        name,
        description,
        rewardDescription,
        primaryColor: primaryColor || null,
        backgroundColor: backgroundColor || null,
        imageUrl: imageUrl || null,
        requireCorrectAnswer,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setSaving(false);
      return;
    }

    router.push("/admin/dashboard");
  };

  if (loading) {
    return (
      <AdminLayout role="superadmin">
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (!game) {
    return (
      <AdminLayout role="superadmin">
        <ErrorMessage message={error || "Hra nenalezena"} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout role="superadmin">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Upravit hru
      </h2>

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Název hry *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Popis
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Popis odměny
          </label>
          <input
            type="text"
            value={rewardDescription}
            onChange={(e) => setRewardDescription(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Obrázek hry
          </label>
          <div className="mt-1">
            {imageUrl && (
              <div className="mb-2">
                <img
                  src={imageUrl}
                  alt="Obrázek hry"
                  className="h-32 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="mt-1 text-xs text-red-600 hover:underline"
                >
                  Odstranit obrázek
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && (
              <p className="mt-1 text-xs text-blue-600">Nahrávám...</p>
            )}
          </div>
        </div>

        {/* Color scheme */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Primární barva
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={primaryColor || "#3B82F6"}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#3B82F6"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Barva pozadí
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={backgroundColor || "#FFFFFF"}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#FFFFFF"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Require correct answer toggle */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Vyžadovat správnou odpověď
              </p>
              <p className="text-xs text-gray-500">
                {requireCorrectAnswer
                  ? "Hráč musí odpovědět správně ke splnění stanoviště"
                  : "Jakákoliv odpověď = stanoviště splněno (volný režim)"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={requireCorrectAnswer}
              onClick={() => setRequireCorrectAnswer(!requireCorrectAnswer)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                requireCorrectAnswer ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  requireCorrectAnswer ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Ukládám..." : "Uložit změny"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Zrušit
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
