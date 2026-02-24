import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
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
  { src: "/examples/disrupt-idea-1.png", caption: "AI Product Visual & Scores", badge: "Disrupt", color: "bg-green-600 text-white" },
  { src: "/examples/disrupt-idea-2.png", caption: "Redesigned Product Concept", badge: "Disrupt", color: "bg-green-600 text-white" },
  { src: "/examples/stress-test-red.png", caption: "Red Team — Why It Will Fail", badge: "Stress Test", color: "bg-red-600 text-white" },
  { src: "/examples/stress-test-green.png", caption: "Green Team — Why It Will Succeed", badge: "Stress Test", color: "bg-green-600 text-white" },
  { src: "/examples/pitch-deck-ask.png", caption: "Investor Pitch Deck — The Ask", badge: "Pitch Deck", color: "bg-blue-600 text-white" },
];

export function ShowcaseGallery() {
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);

  return (
    <section className="mb-20">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Examples
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
        See What It Produces
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        Real outputs from analyses run on this platform. Click any image to expand.
      </p>

      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="-ml-3">
          {SHOWCASE_ITEMS.map((item) => (
            <CarouselItem
              key={item.src}
              className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <button
                type="button"
                onClick={() => setLightbox(item)}
                className="w-full text-left group"
              >
                <div className="relative border border-border rounded-xl overflow-hidden shadow-sm bg-card transition-shadow hover:shadow-md">
                  <span
                    className={`absolute top-2.5 left-2.5 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.color}`}
                  >
                    {item.badge}
                  </span>
                  <img
                    src={item.src}
                    alt={item.caption}
                    loading="lazy"
                    className="w-full aspect-[16/10] object-cover object-top"
                  />
                  <div className="px-3 py-2.5">
                    <p className="text-xs text-muted-foreground leading-snug">
                      {item.caption}
                    </p>
                  </div>
                </div>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 sm:-left-5" />
        <CarouselNext className="-right-4 sm:-right-5" />
      </Carousel>

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-2 sm:p-4 rounded-xl">
          <VisuallyHidden>
            <DialogTitle>{lightbox?.caption ?? "Screenshot"}</DialogTitle>
          </VisuallyHidden>
          {lightbox && (
            <img
              src={lightbox.src}
              alt={lightbox.caption}
              className="w-full rounded-lg"
            />
          )}
          {lightbox && (
            <p className="text-xs text-muted-foreground text-center mt-1">
              {lightbox.caption}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
