import { Navbar } from "@/components/v-intern/navbar";
import { Hero } from "@/components/v-intern/hero";
import { HowItWorks } from "@/components/v-intern/how-it-works";
import { AudienceCards } from "@/components/v-intern/audience-cards";
import { Workflow } from "@/components/v-intern/workflow";
import { Footer } from "@/components/v-intern/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <AudienceCards />
        <Workflow />
      </main>
      <Footer />
    </div>
  );
}
