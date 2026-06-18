import { SUPPORT_EMAIL } from "@/lib/constants";

export const PRIVACY_LAST_UPDATED = "June 18, 2026";

export const PRIVACY_SUMMARY =
  "We collect account and professional information to operate the marketplace, verify credentials, and connect families with providers. We use essential cookies only for core functionality, do not sell your data, and handle information in line with the Philippine Data Privacy Act.";

interface PrivacyContentProps {
  showLastUpdated?: boolean;
  showContact?: boolean;
}

export function PrivacyContent({
  showLastUpdated = true,
  showContact = true
}: PrivacyContentProps = {}) {
  return (
    <div className="flex flex-col gap-4 text-sm text-text-secondary">
      {showLastUpdated ? (
        <p className="text-xs text-text-muted">Last Updated: {PRIVACY_LAST_UPDATED}</p>
      ) : null}
      <h2 className="text-base font-semibold text-text-primary">1. Information We Collect</h2>
      <p>To provide our services, we may collect the following information:</p>
      <h3 className="text-sm font-semibold text-text-primary">Account Information</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Full name</li>
        <li>Email address</li>
        <li>Mobile number</li>
        <li>Profile photo</li>
        <li>Username and password</li>
      </ul>
      <h3 className="text-sm font-semibold text-text-primary">
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
      <h3 className="text-sm font-semibold text-text-primary">Family and Patient Information</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Care requirements</li>
        <li>Preferred service location</li>
        <li>Patient age and general care needs</li>
        <li>Booking and communication records</li>
      </ul>
      <h3 className="text-sm font-semibold text-text-primary">Verification Documents</h3>
      <ul className="list-disc space-y-1 pl-5">
        <li>Government-issued identification cards</li>
        <li>Professional licenses</li>
        <li>Certificates and supporting documents</li>
      </ul>
      <h2 className="text-base font-semibold text-text-primary">2. How We Use Your Information</h2>
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
      <h2 className="text-base font-semibold text-text-primary">3. Data Sharing</h2>
      <p>HanapKalinga does not sell, rent, or trade personal information to third parties.</p>
      <p>Information may be shared only:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Between users when necessary to facilitate care arrangements</li>
        <li>With authorized personnel responsible for account verification</li>
        <li>When required by law, court order, or government authority</li>
        <li>To protect the safety, rights, and security of users and the platform</li>
      </ul>
      <h2 className="text-base font-semibold text-text-primary">4. Data Security</h2>
      <p>
        We implement reasonable technical, administrative, and organizational measures to protect
        personal information against unauthorized access, disclosure, alteration, or destruction.
      </p>
      <p>
        Verification documents are accessible only to authorized personnel involved in account
        verification and compliance processes.
      </p>
      <h2 className="text-base font-semibold text-text-primary">5. User Rights</h2>
      <p>Subject to applicable laws, users may:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Request access to their personal information</li>
        <li>Correct inaccurate information</li>
        <li>Request deletion of their account and associated data</li>
        <li>Withdraw consent where applicable</li>
        <li>Request a copy of their stored information</li>
      </ul>
      <p>Requests may be submitted through our official support channels.</p>
      <h2 className="text-base font-semibold text-text-primary">6. Data Retention</h2>
      <p>
        We retain personal information only for as long as necessary to provide services, comply
        with legal obligations, resolve disputes, and enforce our agreements.
      </p>
      <h2 className="text-base font-semibold text-text-primary">7. Cookies and Tracking</h2>
      <p>
        HanapKalinga uses only essential cookies and browser storage necessary to maintain your
        session and provide core platform functionality. We do not use advertising cookies or
        behavioral tracking cookies. We may use privacy-respecting analytics to understand general
        platform usage patterns without identifying individual users.
      </p>
      <h2 className="text-base font-semibold text-text-primary">8. International Data Transfers</h2>
      <p>
        To operate the platform, HanapKalinga uses third-party service providers that may process
        personal data outside the Philippines. These include hosting, authentication, file storage,
        email delivery, and security services. All such providers are required to maintain
        appropriate data protection and security standards. By using HanapKalinga, you acknowledge
        that your data may be transferred to and processed in countries outside the Philippines in
        connection with these services.
      </p>
      <h2 className="text-base font-semibold text-text-primary">9. Data Breach Notification</h2>
      <p>
        In the event of a personal data breach that may result in serious harm to affected users,
        HanapKalinga will notify affected users and the National Privacy Commission within 72 hours
        of discovery, in accordance with the requirements of the Data Privacy Act of 2012 and its
        Implementing Rules and Regulations. Notification will include the nature of the breach, the
        personal data involved, the measures taken or being taken to address the breach, and steps
        users may take to protect themselves.
      </p>
      <h2 className="text-base font-semibold text-text-primary">10. Third-Party Services</h2>
      <p>
        HanapKalinga may utilize third-party services for hosting, authentication, analytics,
        communications, and other operational functions. These providers are required to maintain
        appropriate security standards.
      </p>
      <h2 className="text-base font-semibold text-text-primary">11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy periodically. Continued use of the platform after updates
        constitutes acceptance of the revised policy.
      </p>
      {showContact ? (
        <>
          <h2 className="text-base font-semibold text-text-primary">12. Contact Information</h2>
          <p>For privacy-related concerns or requests, please contact:</p>
          <p>Email: {SUPPORT_EMAIL}</p>
        </>
      ) : null}
    </div>
  );
}
