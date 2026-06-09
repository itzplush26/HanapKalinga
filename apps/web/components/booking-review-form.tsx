"use client";

import { useState } from "react";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
interface BookingReviewFormProps {
  bookingId: string;
  nurseId: string;
  nurseName: string;
}

export function BookingReviewForm({
  bookingId,
  nurseId,
  nurseName
}: BookingReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        nurseId,
        rating,
        comment: comment.trim() || undefined
      })
    });

    setSubmitting(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to submit review.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Review submitted. Thank you for helping other families choose care.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">
        How was your experience with {nurseName}?
      </h3>
      <StarRating value={rating} onChange={setRating} />
      <Textarea
        placeholder="Tell others about your experience (optional)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <Button type="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit review"}
      </Button>
    </div>
  );
}
