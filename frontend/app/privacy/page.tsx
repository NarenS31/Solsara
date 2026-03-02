"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-[13px] text-black/50 font-medium mb-12">
          Last updated: March 2025
        </p>

        <div className="prose prose-sm max-w-none space-y-6 text-[14px] text-black/70 leading-relaxed">
          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly (such as name, email, business details, and Google Business Profile data), information from your use of the Service (such as usage data and analytics), and information from third-party services you connect (such as Google).
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">2. How We Use Your Information</h2>
            <p>
              We use your information to provide, maintain, and improve the Service; to process transactions; to send you updates and support; and to comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">3. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share data with service providers who assist in operating our business (e.g., hosting, analytics) under strict confidentiality agreements.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">5. Your Rights</h2>
            <p>
              You may access, correct, or delete your personal data through your account settings or by contacting us. You may also opt out of marketing communications at any time.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">6. Cookies</h2>
            <p>
              We use cookies and similar technologies to improve your experience, analyze usage, and personalize content. You can manage cookie preferences in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">7. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-black mb-2">8. Contact</h2>
            <p>
              For privacy-related questions, contact us at{" "}
              <a href="mailto:privacy@solsara.co" className="text-[#0055ff] hover:underline">
                privacy@solsara.co
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
