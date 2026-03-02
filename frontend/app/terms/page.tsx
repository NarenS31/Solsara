"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 md:px-10">
          <Link href="/" className="no-underline">
            <span className="text-[15px] font-black tracking-tight text-black">
              Sol<span className="text-[#0055ff]">sara</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-[12px] font-semibold text-[#0055ff] no-underline hover:text-[#0044dd]"
          >
            ← Back to website
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-16 md:px-10">
        <h1 className="text-[28px] font-black tracking-tight text-black mb-2">
          Terms of Service
        </h1>
        <p className="text-[13px] text-black/50 font-medium mb-12">
          Last updated: March 2025
        </p>

        <div className="prose prose-sm max-w-none space-y-6 text-[14px] text-black/70 leading-relaxed">
          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">1. Agreement</h2>
            <p>
              By using Solsara (&quot;the Service&quot;), you agree to these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">2. Description of Service</h2>
            <p>
              Solsara provides reputation management and review automation tools for businesses. We help you respond to Google reviews and manage your online presence.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">2.1 Data Access Scope</h2>
            <p>
              We only access and process your Google Business Profile reviews and draft/post responses to those reviews. We do not edit your business name, phone number, hours, address, or listing details.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">3. Your Responsibilities</h2>
            <p>
              You are responsible for the accuracy of information you provide, for maintaining the security of your account, and for all activity that occurs under your account.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">4. Acceptable Use</h2>
            <p>
              You agree not to use the Service for any unlawful purpose or in any way that could harm, disable, or impair the Service. You will not attempt to gain unauthorized access to any systems or networks.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">5. Intellectual Property</h2>
            <p>
              Solsara and its content, features, and functionality are owned by Solsara and are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Solsara shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">7. Changes</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">8. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@solsara.co" className="text-[#0055ff] hover:underline">
                legal@solsara.co
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-black/[0.06]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0055ff] no-underline hover:text-[#0044dd]"
          >
            ← Back to Solsara
          </Link>
        </div>
      </div>
    </main>
  );
}
