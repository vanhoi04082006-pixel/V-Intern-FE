"use client";

import { LandingNavbar } from "./landing-navbar";
import { LandingHero } from "./landing-hero";
import {
  AiShowcase,
  CtaBand,
  FaqSection,
  FeaturesBento,
  HowItWorks,
  RolesSection,
  TrustBand,
} from "./landing-sections";
import { LandingFooter } from "./landing-footer";

/** Landing page V-Intern — dark "Emerald Noir", tiếng Việt. */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <TrustBand />
        <HowItWorks />
        <FeaturesBento />
        <AiShowcase />
        <RolesSection />
        <FaqSection />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
