"use client";

import { useState } from "react";
import type { Session, SessionType } from "@/lib/types";
import { splitSeconds } from "@/lib/types";
import { formatSplit, parseDuration } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent";

export function SessionForm({
  onAdd,
  onCancel,
}: {
  onAdd: (session: Session) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<SessionType>("erg");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [strokeRate, setStrokeRate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const distanceMeters = Number(distance);
  const durationSeconds = parseDuration(duration);
  const preview =
    distanceMeters > 0 && durationSeconds
      ? formatSplit(splitSeconds({ distanceMeters, durationSeconds }))
      : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return setError("Pick a date.");
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0)
      return setError("Distance must be a positive number of meters.");
    if (!durationSeconds)
      return setError("Duration should look like 20:00 (mm:ss) or 1:05:30 (h:mm:ss).");
    const spm = strokeRate.trim() === "" ? undefined : Number(strokeRate);
    if (spm !== undefined && (!Number.isFinite(spm) || spm <= 0 || spm > 60))
      return setError("Stroke rate should be between 1 and 60 strokes per minute.");
    onAdd({
      id: crypto.randomUUID(),
      date,
      type,
      distanceMeters,
      durationSeconds,
      strokeRate: spm,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-hairline bg-surface-1 p-4"
      aria-label="Log a session"
    >
      <h2 className="text-base font-semibold text-ink">Log a session</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="col-span-1 block">
          <span className="mb-1 block text-xs text-ink-secondary">Date</span>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <div className="col-span-1">
          <span className="mb-1 block text-xs text-ink-secondary">Type</span>
          <div className="flex rounded-lg border border-hairline p-0.5" role="radiogroup" aria-label="Session type">
            {(["erg", "water"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={type === t}
                onClick={() => setType(t)}
                className={`flex-1 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  type === t
                    ? "bg-accent font-medium text-accent-ink"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                {t === "erg" ? "Erg" : "Water"}
              </button>
            ))}
          </div>
        </div>
        <label className="col-span-1 block">
          <span className="mb-1 block text-xs text-ink-secondary">Distance (m)</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="5000"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="col-span-1 block">
          <span className="mb-1 block text-xs text-ink-secondary">Duration (mm:ss)</span>
          <input
            type="text"
            placeholder="20:00"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="col-span-1 block">
          <span className="mb-1 block text-xs text-ink-secondary">Stroke rate (spm)</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            placeholder="22"
            value={strokeRate}
            onChange={(e) => setStrokeRate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="col-span-2 block sm:col-span-3">
          <span className="mb-1 block text-xs text-ink-secondary">Notes</span>
          <input
            type="text"
            placeholder="Steady state, felt strong"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
        >
          Save session
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm text-ink-secondary hover:text-ink"
        >
          Cancel
        </button>
        {preview && (
          <span className="ml-auto text-sm text-ink-secondary">
            Avg split{" "}
            <span className="font-semibold text-ink tabular-nums">{preview} /500m</span>
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-delta-bad">
          {error}
        </p>
      )}
    </form>
  );
}
