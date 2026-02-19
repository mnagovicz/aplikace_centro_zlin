"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Checkpoint } from "@/lib/types";

export default function CheckpointsPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswers, setFormAnswers] = useState(["", "", ""]);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formOrder, setFormOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // QR state
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const fetchCheckpoints = useCallback(async () => {
    const res = await fetch(`/api/admin/checkpoints?gameId=${gameId}`);
    const data = await res.json();
    if (data.checkpoints) {
      setCheckpoints(data.checkpoints);
    }
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    fetchCheckpoints();
  }, [fetchCheckpoints]);

  const resetForm = () => {
    setFormName("");
    setFormQuestion("");
    setFormAnswers(["", "", ""]);
    setFormCorrectIndex(0);
    setFormOrder(checkpoints.length);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (cp: Checkpoint) => {
    setEditingId(cp.id);
    setFormName(cp.name);
    setFormQuestion(cp.question);
    setFormAnswers([...cp.answers]);
    setFormCorrectIndex(cp.correct_answer_index);
    setFormOrder(cp.order_number);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const filteredAnswers = formAnswers.filter((a) => a.trim());
    if (filteredAnswers.length < 2) {
      setError("Zadejte alespoň 2 odpovědi");
      setSaving(false);
      return;
    }

    const payload = {
      ...(editingId ? { id: editingId } : { gameId }),
      name: formName,
      question: formQuestion,
      answers: filteredAnswers,
      correctAnswerIndex: formCorrectIndex,
      orderNumber: formOrder,
    };

    const res = await fetch("/api/admin/checkpoints", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setSaving(false);
      return;
    }

    resetForm();
    setSaving(false);
    fetchCheckpoints();
  };

  const deleteCheckpoint = async (id: string) => {
    if (!confirm("Opravdu smazat toto stanoviště?")) return;
    await fetch(`/api/admin/checkpoints?id=${id}`, { method: "DELETE" });
    fetchCheckpoints();
  };

  const showQr = async (checkpointId: string) => {
    const res = await fetch("/api/admin/checkpoints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "qr-single",
        checkpointId,
        gameId,
      }),
    });
    const data = await res.json();
    setQrImage(data.qrDataUrl);
    setQrUrl(data.url);
  };

  const downloadAllQr = async () => {
    const res = await fetch("/api/admin/checkpoints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "qr-zip", gameId }),
    });

    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-codes-${gameId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout role="superadmin">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Stanoviště</h2>
        <div className="flex gap-2">
          {checkpoints.length > 0 && (
            <button
              onClick={downloadAllQr}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Stáhnout všechny QR
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setFormOrder(checkpoints.length);
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Přidat stanoviště
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {/* QR modal */}
      {qrImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <img src={qrImage} alt="QR Code" className="mx-auto mb-4" />
            <p className="mb-4 break-all text-center text-xs text-gray-500">
              {qrUrl}
            </p>
            <button
              onClick={() => {
                setQrImage(null);
                setQrUrl(null);
              }}
              className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Zavřít
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-lg font-semibold">
            {editingId ? "Upravit stanoviště" : "Nové stanoviště"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Název *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Obchod ABC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pořadí
                </label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Otázka *
              </label>
              <textarea
                required
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Jakou barvu má logo obchodu?"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Odpovědi * (min. 2)
              </label>
              {formAnswers.map((answer, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={formCorrectIndex === i}
                    onChange={() => setFormCorrectIndex(i)}
                    className="h-4 w-4 text-blue-600"
                    title="Správná odpověď"
                  />
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => {
                      const newAnswers = [...formAnswers];
                      newAnswers[i] = e.target.value;
                      setFormAnswers(newAnswers);
                    }}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={`Odpověď ${i + 1}`}
                  />
                  {formAnswers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newAnswers = formAnswers.filter(
                          (_, idx) => idx !== i
                        );
                        setFormAnswers(newAnswers);
                        if (formCorrectIndex >= newAnswers.length) {
                          setFormCorrectIndex(0);
                        }
                      }}
                      className="text-sm text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {formAnswers.length < 4 && (
                <button
                  type="button"
                  onClick={() => setFormAnswers([...formAnswers, ""])}
                  className="text-sm text-blue-600 hover:underline"
                >
                  + Přidat odpověď
                </button>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Vyberte správnou odpověď kliknutím na kolečko
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Ukládám..."
                  : editingId
                    ? "Uložit"
                    : "Přidat"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Zrušit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {!loading && checkpoints.length === 0 && !showForm && (
        <p className="text-center text-sm text-gray-500">
          Zatím nemáte žádná stanoviště. Přidejte první.
        </p>
      )}

      <div className="space-y-3">
        {checkpoints.map((cp, index) => (
          <div
            key={cp.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900">{cp.name}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-600">{cp.question}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {cp.answers.map((a, i) => (
                    <span
                      key={i}
                      className={`rounded px-2 py-0.5 text-xs ${
                        i === cp.correct_answer_index
                          ? "bg-green-100 font-medium text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => showQr(cp.id)}
                className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                QR kód
              </button>
              <button
                onClick={() => startEdit(cp)}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Upravit
              </button>
              <button
                onClick={() => deleteCheckpoint(cp.id)}
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
