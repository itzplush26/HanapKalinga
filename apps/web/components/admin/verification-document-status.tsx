"use client";

import type { NurseDocumentFields } from "@/lib/admin/verification-documents";
import { getDocumentSlots } from "@/lib/admin/verification-documents";
import { DocumentStatusSlot } from "@/components/admin/document-status-slot";

interface VerificationDocumentStatusProps {
  nurse: NurseDocumentFields;
  compact?: boolean;
}

export function VerificationDocumentStatus({ nurse, compact = false }: VerificationDocumentStatusProps) {
  const slots = getDocumentSlots(nurse);

  return (
    <div className={compact ? "grid gap-2 sm:grid-cols-3" : "grid gap-3 lg:grid-cols-3"}>
      {slots.map((slot) => (
        <DocumentStatusSlot key={slot.key} slot={slot} compact={compact} />
      ))}
    </div>
  );
}
