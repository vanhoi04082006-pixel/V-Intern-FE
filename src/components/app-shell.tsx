"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore, viewFromHash } from "@/lib/store";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { AiInterview } from "@/components/landing/ai-interview";
import { ProductHeart } from "@/components/landing/product-heart";
import { AudienceCards } from "@/components/landing/audience-cards";
import { Workflow } from "@/components/landing/workflow";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

import { AuthView } from "@/components/auth/auth-view";
import { Workspace } from "@/components/workspace/workspace";

/** Trang landing — giữ nguyên thiết kế "Sổ tay hành trình". */
function LandingView() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <AiInterview />
        <ProductHeart />
        <AudienceCards />
        <Workflow />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function ViewSwitch() {
  const view = useAppStore((s) => s.view);

  useEffect(() => {
    // back/forward của trình duyệt → đồng bộ lại view theo hash
    const onHashChange = () => {
      const next = viewFromHash(window.location.hash);
      if (next) useAppStore.setState({ view: next });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (view === "auth") return <AuthView />;
  if (view === "app") return <Workspace />;
  return <LandingView />;
}

/** Gốc cây component — điều phối landing / auth / workspace ngay trong route "/". */
export function VInternApp() {
  const hydrate = useAppStore((s) => s.hydrate);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      }),
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <ViewSwitch />
    </QueryClientProvider>
  );
}
