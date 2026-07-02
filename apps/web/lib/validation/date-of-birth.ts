export const DOB_MIN_AGE = 18;
export const DOB_MAX_AGE = 100;

function toDateOnlyString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateOfBirthBounds(reference = new Date()): {
  min: string;
  max: string;
} {
  const maxDate = new Date(reference);
  maxDate.setUTCFullYear(maxDate.getUTCFullYear() - DOB_MIN_AGE);

  const minDate = new Date(reference);
  minDate.setUTCFullYear(minDate.getUTCFullYear() - DOB_MAX_AGE);

  return {
    min: toDateOnlyString(minDate),
    max: toDateOnlyString(maxDate)
  };
}

export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

export function isWithinDateOfBirthBounds(value: string, reference = new Date()): boolean {
  if (!isValidDateOnly(value)) return false;
  const bounds = getDateOfBirthBounds(reference);
  return value >= bounds.min && value <= bounds.max;
}

export function formatDateOfBirth(value: string | null | undefined): string {
  if (!value || !isValidDateOnly(value)) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
