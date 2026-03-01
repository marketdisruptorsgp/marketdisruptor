

## Plan: Redesign Hero Text on Homepage

### Changes to `src/pages/StartPage.tsx`

1. **Update `ROTATING_WORDS`** to only cycle through `product`, `service`, `business` (with associated CSS color vars):
   ```ts
   const ROTATING_WORDS = [
     { word: "product", color: "hsl(var(--mode-product))" },
     { word: "service", color: "hsl(var(--mode-service))" },
     { word: "business", color: "hsl(var(--mode-business))" },
   ];
   ```

2. **Restyle the hero section**:
   - Remove `text-center`, add `text-left` and constrain width with `max-w-5xl mx-auto`
   - Bump h1 to `text-7xl sm:text-8xl md:text-9xl` (8xl equivalent)
   - "Rethink any" on its own line
   - Rotating word on the next line beneath it, same size, left-aligned, colored per mode
   - Reduce vertical gap between the two lines (tight `leading-[1.05]` or `mt-1`)

3. **Update motion.span** to use `style={{ color: currentWord.color }}` instead of the generic `text-primary` class, and render it as a `block` element so it sits on a new line.

