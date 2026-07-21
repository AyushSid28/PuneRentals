"use client";
import { Metadata } from 'next';
import { PostHogProvider } from '@/lib/analytics/PostHogProvider';

export const metadata: Metadata = {
  title: 'Error – Pune.rent',
  description: 'An unexpected error occurred.',
};

/**
 * Global error component used by Next.js for any unhandled errors
 * (500, 404, etc.). It mirrors the layout styling so the page looks
 * consistent with the rest of the app.
 */
export default function GlobalError({
  error,
}: {
  /** The error that was thrown */
  error: Error & { digest?: string };
}) {
  // Log the error server‑side (you can extend this to send to an
  // external monitoring service if desired)
  console.error('[GlobalError]', error);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased flex flex-col items-center justify-center bg-gray-50">
        <PostHogProvider>
          <div className="max-w-lg p-6 text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Oops! Something went wrong.
            </h1>
            <p className="text-gray-700 mb-2">
              {error?.message ?? 'An unexpected error occurred.'}
            </p>
            <p className="text-sm text-gray-500">
              If the problem persists, please try refreshing the page or
              contact support.
            </p>
          </div>
        </PostHogProvider>
      </body>
    </html>
  );
}
