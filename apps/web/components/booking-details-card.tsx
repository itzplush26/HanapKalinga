import { Badge } from "@/components/ui/badge";
import {
  formatBudgetRange,
  formatPatientCondition,
  parseBookingNotes
} from "@/lib/booking-notes";

interface BookingDetailsCardProps {
  notes: string | null | undefined;
}

export function BookingDetailsCard({ notes }: BookingDetailsCardProps) {
  const details = parseBookingNotes(notes);
  if (!details) return null;

  const condition = formatPatientCondition(details.patientCondition);
  const budget = formatBudgetRange(details.budgetRange);
  const skills = details.requiredSkills ?? [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Booking details</h3>
      <div className="mt-3 space-y-3 text-sm">
        {condition ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Patient condition</p>
            <p className="text-slate-800">{condition}</p>
          </div>
        ) : null}
        {skills.length > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Skills needed</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} className="bg-slate-100 text-slate-700">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {budget ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Budget</p>
            <p className="text-slate-800">{budget}</p>
          </div>
        ) : null}
        {details.additionalInstructions ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Additional notes</p>
            <p className="text-slate-800">{details.additionalInstructions}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
