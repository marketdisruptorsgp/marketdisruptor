import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const SHOWCASE_ITEMS = [
  { src: "/examples/intel-overview.png", caption: "Market Overview & Confidence Scores", badge: "Intel", color: "bg-primary text-primary-foreground" },
  { src: "/examples/intel-user-journey.png", caption: "User Journey Mapping", badge: "Intel", color: "bg-primary text-primary-foreground" },
  { src: "/examples/intel-supply-chain.png", caption: "Supply Chain Intelligence", badge: "Intel", color: "bg-primary text-primary-foreground" },
  { src: "/examples/intel-patent.png", caption: "Patent Landscape & Expired IP", badge: "Intel", color: "bg-primary text-primary-foreground" },
  { src: "/examples/disrupt-idea-1.png", caption: "AI Product Visual & Scores", badge: "Deconstruct", color: "bg-green-600 text-white" },
  { src: "/examples/disrupt-idea-2.png", caption: "Redesigned Product Concept", badge: "Deconstruct", color: "bg-green-600 text-white" },
  { src: "/examples/stress-test-red.png", caption: "Red Team — Why It Will Fail", badge: "Stress Test", color: "bg-red-600 text-white" },
  { src: "/examples/stress-test-green.png", caption: "Green Team — Why It Will Succeed", badge: "Stress Test", color: "bg-green-600 text-white" },
  { src: "/examples/pitch-deck-ask.png", caption: "Investor Pitch Deck — The Ask", badge: "Pitch Deck", color: "bg-blue-600 text-white" },
];

export function ShowcaseGallery() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const lightbox = lightboxIdx !== null ? SHOWCASE_ITEMS[lightboxIdx] : null;

  const goPrev = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? (i - 1 + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length : null));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? (i + 1) % SHOWCASE_ITEMS.length : null));
  }, []);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx, goPrev, goNext]);

  // Auto-rotate carousel
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [api]);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api, onSelect]);

  return (
    <section className="mb-20">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Example</p>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
        Play-Doh — Rethought, Reinvented, Disrupted
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-3xl leading-relaxed">
        This entire analysis was built in under 10 minutes. The platform deconstructed Play-Doh's business model, mapped its supply chain and patent landscape, generated redesigned product concepts with AI visuals, stress-tested every assumption, and produced an investor-ready pitch deck — all automatically.
      </p>

      <Carousel opts={{ align: "start", loop: true }} setApi={setApi} className="w-full">
        <CarouselContent className="-ml-4">
          {SHOWCASE_ITEMS.map((item, idx) => (
            <CarouselItem key={item.src} className="pl-4 basis-full lg:basis-1/2">
              <button type="button" onClick={() => setLightboxIdx(idx)} className="w-full text-left group">
                <div className="relative border border-border rounded-xl overflow-hidden shadow-sm bg-card transition-shadow hover:shadow-md">
                  <span className={`absolute top-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${item.color}`}>
                    {item.badge}
                  </span>
                  <img src={item.src} alt={item.caption} loading="lazy" className="w-full aspect-[16/9] object-cover object-top" />
                  <div className="px-4 py-3">
                    <p className="text-sm text-muted-foreground leading-snug">{item.caption}</p>
                  </div>
                </div>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 sm:-left-5" />
        <CarouselNext className="right-2 sm:-right-5" />
      </Carousel>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {SHOWCASE_ITEMS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => api?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Lightbox with arrows & swipe */}
      <Dialog open={lightboxIdx !== null} onOpenChange={() => setLightboxIdx(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-2 sm:p-4 rounded-xl">
          <VisuallyHidden>
            <DialogTitle>{lightbox?.caption ?? "Screenshot"}</DialogTitle>
          </VisuallyHidden>
          {lightbox && (
            <div
              className="relative select-none"
              onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchStart === null) return;
                const diff = e.changedTouches[0].clientX - touchStart;
                if (Math.abs(diff) > 50) {
                  diff > 0 ? goPrev() : goNext();
                }
                setTouchStart(null);
              }}
            >
              <img src={lightbox.src} alt={lightbox.caption} className="w-full rounded-lg" />

              {/* Prev arrow */}
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow-md transition-opacity hover:bg-background"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} className="text-foreground" />
              </button>

              {/* Next arrow */}
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow-md transition-opacity hover:bg-background"
                aria-label="Next image"
              >
                <ChevronRight size={20} className="text-foreground" />
              </button>

              {/* Counter + caption */}
              <div className="text-center mt-2 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  {(lightboxIdx ?? 0) + 1} / {SHOWCASE_ITEMS.length}
                </p>
                <p className="text-xs text-muted-foreground">{lightbox.caption}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
