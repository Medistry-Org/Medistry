import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Check from "@/components/landing/Check";
import Timeline from "@/components/landing/Timeline";
import Measures from "@/components/landing/Measures";
import Companion from "@/components/landing/Companion";
import Doctors from "@/components/landing/Doctors";
import Maintenance from "@/components/landing/Maintenance";
import Pricing from "@/components/landing/Pricing";
import Pharmacy from "@/components/landing/Pharmacy";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import Motion from "@/components/landing/Motion";
import ComboBanner from "@/components/landing/ComboBanner";

export default function HomePage() {
  return (
    <>
      <ComboBanner />
      <Motion />
      <Nav />
      <main id="main-content">
        <Hero />
        <Check />
        <Timeline />
        <Measures />
        <Companion />
        <Doctors />
        <Maintenance />
        <Pricing />
        <Pharmacy />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
