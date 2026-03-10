"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const oauthReason = searchParams.get("reason");
  const oauthDetail = searchParams.get("detail");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9fc] px-5">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="inline-block mb-8 no-underline">
          <span className="text-[18px] font-black tracking-tight text-black">
            Sol<span className="text-[#0055ff]">sara</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h1 className="text-[24px] font-black tracking-[-0.04em] text-black">Sign in</h1>
          <p className="mt-2 text-[14px] text-black/50 font-medium">
            Use your Google account to access your dashboard.
          </p>

          {oauthError === "oauth_failed" && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[12px] font-semibold text-amber-700">
                Google sign-in didn’t finish. Please try again.
              </p>
              {oauthReason === "no_refresh_token" ? (
                <p className="mt-2 text-[11px] text-amber-700/80">
                  1. Go to{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-800 underline"
                  >
                    myaccount.google.com/permissions
                  </a>
                  <br />
                  2. Find Solsara and remove access
                  <br />
                  3. Try signing in again (use Incognito if it persists)
                </p>
              ) : (
                <>
                  {oauthReason && (
                    <p className="mt-1 text-[11px] text-amber-700/80">
                      Debug: {oauthReason}
                    </p>
                  )}
                  {oauthDetail && (
                    <p className="mt-1 text-[11px] text-amber-700/70 break-words">
                      Detail: {decodeURIComponent(oauthDetail)}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-black/[0.09] bg-white py-3.5 text-[14px] font-semibold text-black shadow-[0_1px_8px_rgba(0,0,0,0.06)] hover:border-black/20 hover:shadow-[0_2px_16px_rgba(0,0,0,0.1)] transition-all duration-200 no-underline"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Link>
          </div>

          <p className="mt-6 text-center text-[12px] text-black/40 font-medium">
            No password needed. One click and you're in.
          </p>
        </div>

        <p className="mt-6 text-center text-[13px] text-black/50">
          <Link href="/" className="text-[#0055ff] font-medium no-underline hover:underline">
            ← Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#f7f9fc] px-5">
          <div className="rounded-xl border border-black/[0.06] bg-white px-5 py-4 text-[13px] font-medium text-black/45 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
            Loading sign in...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
