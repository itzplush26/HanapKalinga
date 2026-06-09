interface ReviewBreakdownProps {
  reviews: { rating: number }[];
  averageRating: number;
  reviewCount: number;
}

export function ReviewBreakdown({ reviews, averageRating, reviewCount }: ReviewBreakdownProps) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-navy-900">{averageRating.toFixed(1)}</p>
          <p className="text-xs text-slate-500">{reviewCount} reviews</p>
        </div>
        <div className="flex-1 space-y-1">
          {counts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-slate-600">{star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-slate-500">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
