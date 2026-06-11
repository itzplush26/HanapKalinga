export type DocumentExpiryStatus = "valid" | "expiring_soon" | "expired" | "missing";

export type DocumentExpiryItem = {
  key: string;
  label: string;
  date: string | null;
  status: DocumentExpiryStatus;
  daysUntil: number | null;
};

export type NurseExpiryFields = {
  provider_type?: string | null;
  prc_license_expiry?: string | null;
  tesda_cert_expiry?: string | null;
  nbi_expiry?: string | null;
};

const EXPIRING_SOON_DAYS = 30;

export function daysUntilDate(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function statusForDate(date: string | null | undefined): Pick<DocumentExpiryItem, "status" | "daysUntil"> {
  if (!date) return { status: "missing", daysUntil: null };
  const days = daysUntilDate(date);
  if (days < 0) return { status: "expired", daysUntil: days };
  if (days <= EXPIRING_SOON_DAYS) return { status: "expiring_soon", daysUntil: days };
  return { status: "valid", daysUntil: days };
}

export function getDocumentExpiryItems(nurse: NurseExpiryFields): DocumentExpiryItem[] {
  const isCaregiver = nurse.provider_type === "caregiver";

  const items: DocumentExpiryItem[] = [
    {
      key: "nbi",
      label: "NBI Clearance",
      date: nurse.nbi_expiry ?? null,
      ...statusForDate(nurse.nbi_expiry)
    }
  ];

  if (isCaregiver) {
    items.unshift({
      key: "tesda",
      label: "TESDA Certificate",
      date: nurse.tesda_cert_expiry ?? null,
      ...statusForDate(nurse.tesda_cert_expiry)
    });
  } else {
    items.unshift({
      key: "prc",
      label: "PRC License",
      date: nurse.prc_license_expiry ?? null,
      ...statusForDate(nurse.prc_license_expiry)
    });
  }

  return items;
}

export function hasExpiredDocuments(nurse: NurseExpiryFields): boolean {
  return getDocumentExpiryItems(nurse).some((item) => item.status === "expired");
}

export function hasExpiringSoonDocuments(nurse: NurseExpiryFields): boolean {
  return getDocumentExpiryItems(nurse).some((item) => item.status === "expiring_soon");
}

export function getExpiredDocumentLabels(nurse: NurseExpiryFields): string[] {
  return getDocumentExpiryItems(nurse)
    .filter((item) => item.status === "expired")
    .map((item) => item.label);
}
