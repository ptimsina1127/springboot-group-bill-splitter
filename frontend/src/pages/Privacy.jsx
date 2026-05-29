import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-[2rem] shadow-2xl p-6 sm:p-10 lg:p-12 border border-slate-100 transition-smooth">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: May 27, 2026</p>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Data We Collect</h2>
              <p>When you use BillSplitter, we store only the data you provide:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Session name and optional identifier</li>
                <li>Participant names</li>
                <li>Expense descriptions and amounts</li>
              </ul>
              <p className="mt-2">We do <strong>not</strong> collect email addresses, passwords, location data, device identifiers, or any personal contact information.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">2. How We Store Your Data</h2>
              <p>All data is stored in an encrypted MySQL database hosted on Oracle Cloud infrastructure (Frankfurt region). Communication with our server is encrypted via HTTPS/TLS.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">3. How We Use Your Data</h2>
              <p>Your data is used exclusively to provide the bill-splitting functionality: calculating shares, tracking expenses, and displaying settlement information. We do not use your data for analytics, advertising, or any other purpose.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">4. Data Sharing</h2>
              <p>We do <strong>not</strong> sell, trade, or share your data with third parties. Session data is only accessible to people who have the session link or short code.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">5. Data Retention & Deletion</h2>
              <p>You can delete your session at any time using the web or mobile app, which permanently removes all associated data. Sessions with no activity for 6 months are automatically deleted.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">6. Your Rights</h2>
              <p>You have the right to request a copy of your data or ask for its deletion at any time. To exercise these rights, contact us at the email below.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">7. Contact</h2>
              <p>For any privacy-related inquiries or data deletion requests, please contact:</p>
              <p className="mt-1 font-medium text-brand-600">pravatktimsina@gmail.com</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">8. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated date.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
