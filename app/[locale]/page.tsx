import { CategoryBelt } from '@/components/home/CategoryBelt';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { EndingSoon } from '@/components/sections/EndingSoon';
import { LiveAuctions } from '@/components/sections/LiveAuctions';
import { PopularCategories } from '@/components/sections/PopularCategories';
import { WhyBidinsouk } from '@/components/sections/WhyBidinsouk';
import { VerifiedReviews } from '@/components/sections/VerifiedReviews';
import { CTASection } from '@/components/sections/CTASection';

export default function Home() {
  return (
    <div>
      {/* Category Belt */}
      <CategoryBelt />
      
      {/* Hero Carousel */}
      <HeroCarousel />
      
      {/* CTA Section */}
      <CTASection />
      
      {/* Ending Soon Section */}
      <EndingSoon />
      
      {/* Live Auctions Section */}
      <LiveAuctions />
      
      {/* Popular Categories Section */}
      <PopularCategories />
      
      {/* Why Bidinsouk Section */}
      <WhyBidinsouk />
      
      {/* Verified Reviews Section */}
      <VerifiedReviews />
    </div>
  );
}