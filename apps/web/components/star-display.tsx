import { cn } from "@/lib/utils";

interface StarDisplayProps {
  rating: number;
  className?: string;
  size?: "sm" | "md";
}

export function StarDisplay({ rating, className, size = "md" }: StarDisplayProps) {
  const rounded = Math.round(rating * 2) / 2;
  const sizeClass = size === "sm" ? "text-sm" : "text-base";

  return (
    <span className={cn("inline-flex gap-0.5 text-amber-400", sizeClass, className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{star <= rounded ? "★" : "☆"}</span>
      ))}
    </span>
  );
}
