import { PrivacyContent } from "@/lib/legal/privacy-content";

export default function PrivacyPage() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">Privacy Policy</h1>
        <PrivacyContent />
      </div>
    </main>
  );
}
