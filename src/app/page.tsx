import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    // ALWAYS redirect to dashboard for authenticated users with completed onboarding
    // This ensures the app always starts at the dashboard
    if (user.profile?.onboardingDone) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding/willkommen");
    }
  }

  redirect("/login");
}

// Force dynamic rendering to ensure redirect happens on every visit
export const dynamic = 'force-dynamic';
