import { NextResponse } from "next/server";
import { initiateConnectOnboarding } from "@/lib/actions/wallet";

export const dynamic = "force-dynamic";

// Handles both:
// • GET /api/stripe/connect/onboard  — fresh start or refresh from Stripe
// Returns a redirect to the Stripe-hosted onboarding page.
export async function GET() {
  const result = await initiateConnectOnboarding();

  if (result.error || !result.url) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${origin}/profile?connect_error=${encodeURIComponent(result.error ?? "unknown")}`,
    );
  }

  return NextResponse.redirect(result.url);
}
