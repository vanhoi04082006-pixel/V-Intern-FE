import { Navbar } from "@/components/v-intern/navbar";
import { Hero } from "@/components/v-intern/hero";
import { HowItWorks } from "@/components/v-intern/how-it-works";
import { AiInterviewShowcase } from "@/components/v-intern/ai-interview-showcase";
import { ProductHeart } from "@/components/v-intern/product-heart";
import { AudienceCards } from "@/components/v-intern/audience-cards";
import { Workflow } from "@/components/v-intern/workflow";
import { FinalCta } from "@/components/v-intern/final-cta";
import { Footer } from "@/components/v-intern/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <AiInterviewShowcase />
        <ProductHeart />
        <AudienceCards />
        <Workflow />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
