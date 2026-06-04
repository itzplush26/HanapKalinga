"use client";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-2xl leading-none text-amber-400"
          aria-label={`Rate ${star} stars`}
        >
          {star <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
