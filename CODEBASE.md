# CODEBASE Notes

## Verification Renewal Decision (2026-07-01)

- Implemented **Option B** for early document renewal: `verification_status = renewal_under_review`.
- Rationale: nurses/caregivers stay publicly verified while renewed documents are reviewed, avoiding downtime.
- Early renewal flow (`expiring_soon`):
  - Nurse uploads renewed doc.
  - Status transitions to `renewal_under_review`.
  - Provider remains visible/bookable as verified.
- Expired document flow (`expired`):
  - Nurse uploads renewed doc.
  - Status transitions to `pending`.
  - Expired lockout behavior remains unchanged until admin approval.
