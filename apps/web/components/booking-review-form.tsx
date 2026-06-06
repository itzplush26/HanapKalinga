"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mapSupabaseError } from "@/lib/user-errors";

interface BookingReviewFormProps {
  bookingId: string;
  nurseId: string;
  nurseName: string;
  reviewerId: string;
}

export function BookingReviewForm({
  bookingId,
  nurseId,
  nurseName,
  reviewerId
}: BookingReviewFormProps) {
  const supabase = createClient();
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

    const { error: insertError } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      reviewer_id: reviewerId,
      reviewee_id: nurseId,
      rating,
      comment: comment.trim() || null
    });

    setSubmitting(false);

    if (insertError) {
      setError(mapSupabaseError(insertError, "generic"));
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
        placeholder="Share your experience (optional)"
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
