import { MAX_DOCUMENT_SIZE_LABEL } from "@/lib/constants";

interface DocumentPendingRowProps {
  label: string;
}

export function DocumentPendingRow({ label }: DocumentPendingRowProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      <p className="text-xs text-text-muted">PDF or image, max {MAX_DOCUMENT_SIZE_LABEL}</p>
      <p className="mt-2 text-xs font-medium text-warning">Verification pending</p>
    </div>
  );
}
