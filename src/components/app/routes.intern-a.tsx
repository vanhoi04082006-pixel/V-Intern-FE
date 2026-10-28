"use client";

/** Registry INTERN-A (dashboard + onboarding) — Task 2-a sở hữu file này. */
import type { RouteDefinition } from "./route-types";
import { InternDashboardView } from "@/components/views/intern/dashboard/dashboard-view";
import { OnboardingWelcomeView } from "@/components/views/intern/onboarding/onboarding-welcome-view";
import { OnboardingRoleView } from "@/components/views/intern/onboarding/onboarding-role-view";
import { OnboardingInterviewView } from "@/components/views/intern/onboarding/onboarding-interview-view";
import { OnboardingResultView } from "@/components/views/intern/onboarding/onboarding-result-view";

export const internARoutes: RouteDefinition[] = [
  { pattern: "/intern", component: InternDashboardView },
  { pattern: "/intern/onboarding", component: OnboardingWelcomeView },
  { pattern: "/intern/onboarding/role", component: OnboardingRoleView },
  { pattern: "/intern/onboarding/interview", component: OnboardingInterviewView },
  { pattern: "/intern/onboarding/result", component: OnboardingResultView },
];
