

## Remove Quick Launch Buttons from Homepage

Remove the "Quick Launch Buttons" section (Product → / Service → / Business Model →) from `src/pages/StartPage.tsx`. This is the section at approximately lines 228-245 that renders the three mode buttons.

### File to change
- `src/pages/StartPage.tsx` — delete the Quick Launch Buttons `<section>` block (the one with `MODES.map`)

