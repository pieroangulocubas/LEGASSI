import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { RegularizacionBanner } from "@/components/regularizacion-banner"
import { ServicesSection } from "@/components/services-section"
import { ToolsSection } from "@/components/tools-section"
import { ResolucionesFavorablesSection } from "@/components/resoluciones-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { HowWeWorkSection } from "@/components/how-we-work-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { WhatsAppButton } from "@/components/whatsapp-button"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen">
        <HeroSection />
        <RegularizacionBanner />
        <ResolucionesFavorablesSection />
        <ServicesSection />
        <ToolsSection />
        <TestimonialsSection />
        <HowWeWorkSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
