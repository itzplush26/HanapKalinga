export type DocumentSlotState = "uploaded" | "missing" | "na" | "expiring_soon" | "expired";

export interface NurseDocumentFields {
  provider_type: string | null;
  prc_document_url: string | null;
  tesda_document_url: string | null;
  nbi_document_url: string | null;
  prc_license_expiry?: string | null;
  tesda_cert_expiry?: string | null;
  nbi_expiry?: string | null;
}

export interface DocumentSlot {
  key: "prc" | "tesda" | "nbi";
  label: string;
  state: DocumentSlotState;
  documentPath: string | null;
  expiryDate: string | null;
}

function isExpired(date: string | null | undefined): boolean {
  if (!date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return date.slice(0, 10) < today;
}

function isExpiringSoon(date: string | null | undefined): boolean {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${date}T00:00:00`);
  const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil >= 0 && daysUntil <= 30;
}

function slotState(
  applicable: boolean,
  documentPath: string | null,
  expiryDate: string | null | undefined
): DocumentSlotState {
  if (!applicable) return "na";
  if (!documentPath?.trim()) return "missing";
  if (isExpired(expiryDate ?? null)) return "expired";
  if (isExpiringSoon(expiryDate ?? null)) return "expiring_soon";
  return "uploaded";
}

export function getDocumentSlots(nurse: NurseDocumentFields): DocumentSlot[] {
  const isCaregiver = nurse.provider_type === "caregiver";

  return [
    {
      key: "prc",
      label: "PRC license",
      state: slotState(!isCaregiver, nurse.prc_document_url, nurse.prc_license_expiry),
      documentPath: nurse.prc_document_url,
      expiryDate: nurse.prc_license_expiry ?? null
    },
    {
      key: "tesda",
      label: "TESDA NC II certificate",
      state: slotState(isCaregiver, nurse.tesda_document_url, nurse.tesda_cert_expiry),
      documentPath: nurse.tesda_document_url,
      expiryDate: nurse.tesda_cert_expiry ?? null
    },
    {
      key: "nbi",
      label: "NBI clearance",
      state: slotState(true, nurse.nbi_document_url, nurse.nbi_expiry),
      documentPath: nurse.nbi_document_url,
      expiryDate: nurse.nbi_expiry ?? null
    }
  ];
}

export function getMissingDocumentLabels(nurse: NurseDocumentFields): string[] {
  const missing: string[] = [];
  const isCaregiver = nurse.provider_type === "caregiver";

  if (isCaregiver) {
    if (!nurse.tesda_document_url?.trim()) missing.push("TESDA NC II certificate");
  } else if (!nurse.prc_document_url?.trim()) {
    missing.push("PRC license scan");
  }

  if (!nurse.nbi_document_url?.trim()) missing.push("NBI clearance");

  return missing;
}

export function hasRequiredDocuments(nurse: NurseDocumentFields): boolean {
  return getMissingDocumentLabels(nurse).length === 0;
}

export function getMissingDocumentsTooltip(nurse: NurseDocumentFields): string | null {
  const missing = getMissingDocumentLabels(nurse);
  if (missing.length === 0) return null;
  if (missing.length === 1) return `Cannot verify — ${missing[0]} is missing.`;
  return `Cannot verify — ${missing[0]} and ${missing[1]} are both missing.`;
}

export function hasIncompleteDocuments(nurse: NurseDocumentFields): boolean {
  return !hasRequiredDocuments(nurse);
}
