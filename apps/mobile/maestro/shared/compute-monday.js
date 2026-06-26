// Compute the current week's Monday date (YYYY-MM-DD).
// This is used by set-availability.yaml to toggle morning shifts.
// In CI, dateStr is also passed via --env as a fallback for Maestro versions
// where runScript output scoping is unreliable (e.g. 1.39.0).
const now = new Date();
const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
const diff = now.getDate() - day + (day === 0 ? -6 : 1);
const monday = new Date(now.getFullYear(), now.getMonth(), diff);
const dateStr = monday.toISOString().split('T')[0];

if (typeof output !== 'undefined') {
  output.dateStr = dateStr;
} else {
  // Fallback: if output is not available (should not happen in Maestro),
  // log the value for debugging.
  console.log('dateStr=' + dateStr);
}
