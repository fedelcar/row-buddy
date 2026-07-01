"use client";

import { useActionState, useState } from "react";
import { createSession, type SessionFormState } from "@/app/actions/sessions";
import { SESSION_TYPE_LABEL, SESSION_TYPES, type SessionType } from "@/lib/domain";
import type { Athlete } from "@/db/schema";
import { btnPrimary, inputClass } from "./ui";

export function SessionForm({ athletes }: { athletes: Athlete[] }) {
  const [state, formAction, pending] = useActionState<SessionFormState, FormData>(
    createSession,
    {},
  );
  const [type, setType] = useState<SessionType>("water");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const withResults = type === "water" || type === "erg";

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-4">
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
        <label className="block">
          <span className="mb-1 block text-sm text-ink-secondary">Type</span>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as SessionType)}
            className={inputClass}
          >
            {SESSION_TYPES.map((t) => (
              <option key={t} value={t}>
                {SESSION_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        {withResults && (
          <label className="block">
            <span className="mb-1 block text-sm text-ink-secondary">Distance (m)</span>
            <input
              type="number"
              name="distanceMeters"
              inputMode="numeric"
              min={1}
              placeholder="12000"
              className={inputClass}
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm text-ink-secondary">Duration (mm:ss)</span>
          <input type="text" name="duration" placeholder="75:00" className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-ink-secondary">Notes</span>
        <input
          name="notes"
          placeholder="Steady state, focus on catches"
          className={inputClass}
        />
      </label>

      <fieldset>
        <legend className="mb-1 text-sm text-ink-secondary">
          Who was there?{" "}
          <span className="text-ink-muted">
            {withResults ? "— add a time or rate per athlete if you have one" : ""}
          </span>
        </legend>
        <div className="overflow-hidden rounded-lg border border-hairline">
          {athletes.map((a) => {
            const on = selected.has(a.id);
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-2 border-b border-hairline px-3 py-2 last:border-b-0"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-1">
                  <input
                    type="checkbox"
                    name="athletes"
                    value={a.id}
                    checked={on}
                    onChange={() => toggle(a.id)}
                    className="h-5 w-5 shrink-0 accent-(--accent)"
                  />
                  <span className="truncate text-sm text-ink">{a.name}</span>
                </label>
                {on && withResults && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name={`time-${a.id}`}
                      placeholder="time 48:20"
                      aria-label={`Time for ${a.name}`}
                      className={`${inputClass} w-28 px-2 py-1.5 text-sm`}
                    />
                    <input
                      type="number"
                      name={`spm-${a.id}`}
                      placeholder="spm"
                      aria-label={`Stroke rate for ${a.name}`}
                      min={1}
                      max={60}
                      className={`${inputClass} w-20 px-2 py-1.5 text-sm`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm text-delta-bad">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Save session"}
      </button>
    </form>
  );
}
