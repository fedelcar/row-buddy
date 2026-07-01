export function formatMeters(m: number): string {
  if (m >= 1_000_000) return `${(m / 1_000_000).toFixed(1)}M`;
  if (m >= 10_000) return `${(m / 1000).toFixed(1)}k`;
  return m.toLocaleString("en-US");
}

/** "mm:ss" or "h:mm:ss" from seconds. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** Split as "m:ss.t" per 500m, e.g. "1:52.3". */
export function formatSplit(splitSeconds: number): string {
  const m = Math.floor(splitSeconds / 60);
  const s = splitSeconds - m * 60;
  const tenths = s.toFixed(1).padStart(4, "0");
  return `${m}:${tenths}`;
}

/** Parse "mm:ss", "h:mm:ss", or plain minutes into seconds. Returns null if invalid. */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || !/^\d+(\.\d+)?$/.test(p))) return null;
  const nums = parts.map(Number);
  let seconds: number;
  if (nums.length === 1) seconds = nums[0] * 60;
  else if (nums.length === 2) seconds = nums[0] * 60 + nums[1];
  else if (nums.length === 3) seconds = nums[0] * 3600 + nums[1] * 60 + nums[2];
  else return null;
  return seconds > 0 ? seconds : null;
}

export function formatDateShort(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateLong(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
