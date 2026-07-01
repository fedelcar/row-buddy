"use client";

import { useActionState, useState } from "react";
import { createErgTest, type TestFormState } from "@/app/actions/tests";
import { TEST_DISTANCES, TEST_TYPES, type TestType } from "@/lib/domain";
import type { Athlete } from "@/db/schema";
import { formatSplit, parseDuration } from "@/lib/format";
import { btnPrimary, inputClass } from "./ui";

export function ErgTestForm({
  athletes,
  defaultAthleteId,
}: {
  athletes: Athlete[];
  defaultAthleteId?: number;
}) {
  const [state, formAction, pending] = useActionState<TestFormState, FormData>(createErgTest, {});
  const [testType, setTestType] = useState<TestType>("2k");
  const [time, setTime] = useState("");
  const [meters, setMeters] = useState("");

  const preview = (() => {
    if (testType === "30min") {
      const m = Number(meters);
      return m > 0 ? formatSplit((30 * 60) / (m / 500)) : null;
    }
    const t = parseDuration(time);
    return t ? formatSplit(t / (TEST_DISTANCES[testType] / 500)) : null;
  })();

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-ink-secondary">Athlete</span>
        <select name="athleteId" defaultValue={defaultAthleteId ?? ""} className={inputClass} required>
          <option value="" disabled>
            Pick an athlete…
          </option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm text-ink-secondary">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            max={new Date().toISOString().slice(0, 10)}
            className={inputClass}
            required
          />
        </label>
        <div>
          <span className="mb-1 block text-sm text-ink-secondary">Test</span>
          <div className="grid grid-cols-4 rounded-lg border border-hairline p-0.5" role="radiogroup" aria-label="Test type">
            {TEST_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={testType === t}
                onClick={() => setTestType(t)}
                className={`rounded-md px-1 py-2 text-sm transition-colors ${
                  testType === t
                    ? "bg-accent font-medium text-accent-ink"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <input type="hidden" name="testType" value={testType} />
        </div>
        {testType === "30min" ? (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-secondary">Meters covered</span>
            <input
              type="number"
              name="distanceMeters"
              inputMode="numeric"
              min={1}
              placeholder="7500"
              value={meters}
              onChange={(e) => setMeters(e.target.value)}
              className={inputClass}
              required
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-secondary">Time (mm:ss.t)</span>
            <input
              type="text"
              name="time"
              placeholder={testType === "2k" ? "7:21.5" : "19:45.0"}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
              required
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm text-ink-secondary">Stroke rate (spm)</span>
          <input
            type="number"
            name="strokeRate"
            inputMode="numeric"
            min={1}
            max={60}
            placeholder="28"
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-ink-secondary">Notes</span>
        <input name="notes" placeholder="Negative split, strong finish" className={inputClass} />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Saving…" : "Save test"}
        </button>
        {preview && (
          <span className="text-sm text-ink-secondary">
            Avg split <span className="font-semibold text-ink tabular-nums">{preview} /500m</span>
          </span>
        )}
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-delta-bad">
          {state.error}
        </p>
      )}
    </form>
  );
}
