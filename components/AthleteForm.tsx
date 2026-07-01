"use client";

import { useActionState } from "react";
import { createAthlete, updateAthlete, type AthleteFormState } from "@/app/actions/athletes";
import type { Athlete } from "@/db/schema";
import { btnPrimary, inputClass } from "./ui";

const SIDE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "port", label: "Port" },
  { value: "starboard", label: "Starboard" },
  { value: "both", label: "Both sides" },
  { value: "scull", label: "Scull" },
];

export function AthleteForm({ athlete }: { athlete?: Athlete }) {
  const action = athlete ? updateAthlete : createAthlete;
  const [state, formAction, pending] = useActionState<AthleteFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {athlete && <input type="hidden" name="id" value={athlete.id} />}
      <label className="block">
        <span className="mb-1 block text-sm text-ink-secondary">Name</span>
        <input
          name="name"
          defaultValue={athlete?.name}
          placeholder="Sam Fairbairn"
          className={inputClass}
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm text-ink-secondary">Age group</span>
          <input
            name="ageGroup"
            defaultValue={athlete?.ageGroup ?? ""}
            placeholder="U19, Senior, Masters…"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink-secondary">Side</span>
          <select name="side" defaultValue={athlete?.side ?? ""} className={inputClass}>
            {SIDE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-ink-secondary">Weight class</span>
          <input
            name="weightClass"
            defaultValue={athlete?.weightClass ?? ""}
            placeholder="Open, Lightweight…"
            className={inputClass}
          />
        </label>
      </div>
      {athlete && (
        <label className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            name="active"
            defaultChecked={athlete.active}
            className="h-5 w-5 accent-(--accent)"
          />
          <span className="text-sm text-ink">
            Active <span className="text-ink-muted">(inactive athletes are hidden from the dashboard)</span>
          </span>
        </label>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-delta-bad">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : athlete ? "Save changes" : "Add athlete"}
      </button>
    </form>
  );
}
