import { TermsContent } from "@/lib/legal/terms-content";

export default function TermsPage() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">Terms of Service</h1>
        <TermsContent />
      </div>
    </main>
  );
}
