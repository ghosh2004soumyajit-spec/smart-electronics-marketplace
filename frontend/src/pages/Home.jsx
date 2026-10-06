import Hero from '../components/home/Hero';
import SpecTicker from '../components/home/SpecTicker';
import CategoryIndex from '../components/home/CategoryIndex';
import FinderStrip from '../components/home/FinderStrip';
import OffersBand from '../components/home/OffersBand';
import FeaturedPicks from '../components/home/FeaturedPicks';
import TrustStrip from '../components/home/TrustStrip';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Home — the guided story in one scroll:
 * promise (hero + live datasheet) → rules ticker → catalog index →
 * rule-based finder → offers with small print → verified picks → trust.
 * No auto-rotating anything.
 */
export default function Home() {
  useDocumentTitle('Spec-first smart electronics');
  return (
    <>
      <Hero />
      <SpecTicker />
      <CategoryIndex />
      <FinderStrip />
      <OffersBand />
      <FeaturedPicks />
      <TrustStrip />
    </>
  );
}
