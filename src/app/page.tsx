import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Check from "@/components/Check";
import Timeline from "@/components/Timeline";
import Measures from "@/components/Measures";
import Companion from "@/components/Companion";
import Doctors from "@/components/Doctors";
import Maintenance from "@/components/Maintenance";
import Pricing from "@/components/Pricing";
import Pharmacy from "@/components/Pharmacy";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Motion from "@/components/Motion";

export default function HomePage() {
  return (
    <>
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
