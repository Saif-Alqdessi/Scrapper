import { NavBar } from "./components/NavBar";
import { HeroSection } from "./components/HeroSection";
import { SocialProofBar } from "./components/SocialProofBar";
import { ServicesSection } from "./components/ServicesSection";
import { DoctorsSection } from "./components/DoctorsSection";
import { WhyChooseUs } from "./components/WhyChooseUs";
import { TestimonialsSection } from "./components/TestimonialsSection";
import { InsuranceSection } from "./components/InsuranceSection";
import { ContactForm } from "./components/ContactForm";
import { LocationSection } from "./components/LocationSection";
import { FinalCTABanner } from "./components/FinalCTABanner";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <HeroSection />
      <SocialProofBar />
      <ServicesSection />
      <DoctorsSection />
      <WhyChooseUs />
      <TestimonialsSection />
      <InsuranceSection />
      <ContactForm />
      <LocationSection />
      <FinalCTABanner />
      <Footer />
    </div>
  );
}
