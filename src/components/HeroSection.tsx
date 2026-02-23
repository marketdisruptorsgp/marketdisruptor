import { PlatformNav } from "@/components/PlatformNav";
import { TierKey } from "@/hooks/useSubscription";

interface HeroSectionProps {
  tier: TierKey;
  remainingAnalyses: number | null;
  profileFirstName?: string;
  onOpenSaved?: () => void;
  savedCount?: number;
}

export function HeroSection({ tier, onOpenSaved, savedCount }: HeroSectionProps) {
  return (
    <header className="bg-background">
      <PlatformNav tier={tier} onOpenSaved={onOpenSaved} savedCount={savedCount} />
    </header>
  );
}
