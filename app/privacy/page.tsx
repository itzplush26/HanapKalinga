export default function PrivacyPage() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-4 text-sm text-slate-700">
        <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
        <p>
          NurseLink PH collects only the information needed to operate the marketplace: account details,
          contact information, location details, and care-related profile data.
        </p>
        <p>
          We use your data to match families and nurses, verify credentials, and provide booking
          communications. We do not sell your personal information.
        </p>
        <p>
          Uploaded documents are stored securely and are visible only to authorized admins for
          verification purposes.
        </p>
        <p>
          You may request access, updates, or deletion of your data by contacting the admin.
        </p>
      </div>
    </main>
  );
}
