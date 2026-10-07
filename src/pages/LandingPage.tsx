import { Hero, MarketingNav } from '../components/marketing/Hero'
import { ScrollProgress } from '../components/motion/ScrollProgress'
import {
  AgencyWorkflow,
  ChangelogSection,
  HowItWorks,
  MultiSiteSection,
  ProblemSection,
  ProductPreview,
  SolutionSection,
  TrustStrip,
} from '../components/marketing/Sections'
import {
  AgentsSection,
  FinalCta,
  Footer,
  PricingSection,
} from '../components/marketing/Closing'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <ScrollProgress />
      <MarketingNav />
      <main>
        <Hero />
        <TrustStrip />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <ProductPreview />
        <MultiSiteSection />
        <AgentsSection />
        <AgencyWorkflow />
        <ChangelogSection />
        <PricingSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
