

## Fix: Stable "Rethink any" heading with left-aligned text offset toward center

The issue is that `text-center` causes the entire line to reflow as the rotating word changes width. The fix: left-align the text but add left padding/margin to push it toward center, so "Rethink any" stays pinned in one spot and only the colored word changes.

### Changes in `src/pages/DashboardPage.tsx`

**Line 88**: Remove `text-center` from the container div, add left padding to offset toward center:
```
<div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-5 sm:pb-10">
```

**Lines 89-100**: Left-align heading, add `pl-[15%] sm:pl-[20%]` to push it rightward so it feels more centered on the page. The rotating word gets a fixed `min-w-[180px] sm:min-w-[320px]` so "Rethink any" never shifts:
```tsx
<h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight whitespace-nowrap pl-[15%] sm:pl-[20%]">
  Rethink any{" "}
  <span
    className="inline-block transition-opacity duration-300 text-left"
    style={{ ... }}
  >
    {MODE_WORDS[wordIndex].label}
  </span>
</h1>
```

**Subtitle + buttons below** (lines 101-115): Add matching `text-center` back to the subtitle `<p>` and button container so they stay centered independently of the heading.

