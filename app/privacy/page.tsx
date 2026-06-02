export default function PrivacyPage() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-4 text-sm text-slate-700">
        <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last Updated: June 2, 2026</p>
        <p>
          Welcome to NurseLink PH. We are committed to protecting your privacy and handling your
          personal information responsibly and in accordance with applicable Philippine laws,
          including the Data Privacy Act of 2012 (Republic Act No. 10173).
        </p>
        <h2 className="text-base font-semibold text-slate-900">1. Information We Collect</h2>
        <p>To provide our services, we may collect the following information:</p>
        <h3 className="text-sm font-semibold text-slate-900">Account Information</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Full name</li>
          <li>Email address</li>
          <li>Mobile number</li>
          <li>Profile photo</li>
          <li>Username and password</li>
        </ul>
        <h3 className="text-sm font-semibold text-slate-900">
          Professional Information (For Nurses and Caregivers)
        </h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Professional credentials</li>
          <li>PRC License Number (if applicable)</li>
          <li>Certifications and training records</li>
          <li>Work experience</li>
          <li>Availability schedules</li>
          <li>Resume or curriculum vitae</li>
        </ul>
        <h3 className="text-sm font-semibold text-slate-900">Family and Patient Information</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Care requirements</li>
          <li>Preferred service location</li>
          <li>Patient age and general care needs</li>
          <li>Booking and communication records</li>
        </ul>
        <h3 className="text-sm font-semibold text-slate-900">Verification Documents</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Government-issued identification cards</li>
          <li>Professional licenses</li>
          <li>Certificates and supporting documents</li>
        </ul>
        <h2 className="text-base font-semibold text-slate-900">2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create and manage user accounts</li>
          <li>Verify professional credentials</li>
          <li>Facilitate communication between users</li>
          <li>Improve platform functionality</li>
          <li>Respond to inquiries and support requests</li>
          <li>Prevent fraud, abuse, and unauthorized access</li>
          <li>Comply with legal and regulatory obligations</li>
        </ul>
        <h2 className="text-base font-semibold text-slate-900">3. Data Sharing</h2>
        <p>NurseLink PH does not sell, rent, or trade personal information to third parties.</p>
        <p>Information may be shared only:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Between users when necessary to facilitate care arrangements</li>
          <li>With authorized personnel responsible for account verification</li>
          <li>When required by law, court order, or government authority</li>
          <li>To protect the safety, rights, and security of users and the platform</li>
        </ul>
        <h2 className="text-base font-semibold text-slate-900">4. Data Security</h2>
        <p>
          We implement reasonable technical, administrative, and organizational measures to protect
          personal information against unauthorized access, disclosure, alteration, or destruction.
        </p>
        <p>
          Verification documents are accessible only to authorized personnel involved in account
          verification and compliance processes.
        </p>
        <h2 className="text-base font-semibold text-slate-900">5. User Rights</h2>
        <p>Subject to applicable laws, users may:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Request access to their personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of their account and associated data</li>
          <li>Withdraw consent where applicable</li>
          <li>Request a copy of their stored information</li>
        </ul>
        <p>Requests may be submitted through our official support channels.</p>
        <h2 className="text-base font-semibold text-slate-900">6. Data Retention</h2>
        <p>
          We retain personal information only for as long as necessary to provide services, comply
          with legal obligations, resolve disputes, and enforce our agreements.
        </p>
        <h2 className="text-base font-semibold text-slate-900">7. Third-Party Services</h2>
        <p>
          NurseLink PH may utilize third-party services for hosting, authentication, analytics,
          communications, and other operational functions. These providers are required to maintain
          appropriate security standards.
        </p>
        <h2 className="text-base font-semibold text-slate-900">8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. Continued use of the platform after
          updates constitutes acceptance of the revised policy.
        </p>
        <h2 className="text-base font-semibold text-slate-900">9. Contact Information</h2>
        <p>For privacy-related concerns or requests, please contact:</p>
        <p>Email: nurselinkph@gmail.com</p>
      </div>
    </main>
  );
}
