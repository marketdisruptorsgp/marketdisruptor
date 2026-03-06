# yes, but if they click light/dark anywhere, it must apply to all those places (new analysis, workspace/command deck, insight graph, etc..) also it should be more noticable for the user, not hard to see/find.   
  
Light/Dark Mode for Workspace & New Analysis Pages

## What Changes

Add the workspace theme toggle (light/dark) to the **New Analysis** and **Workspace** pages, matching the behavior already present on analysis step pages and Command Deck. The landing page, resources, and other public pages remain unchanged.

## Implementation

### 1. `src/pages/NewAnalysisPage.tsx`

- Import `useWorkspaceTheme` and `WorkspaceThemeToggle`
- Call `useWorkspaceTheme()` at the top of the component (this applies `data-command-deck` on `<html>` for dark mode)
- Add `<WorkspaceThemeToggle>` button in the header area (next to the HeroSection or as a floating control in the top-right of the main content area)

### 2. `src/pages/WorkspacePage.tsx`

- Same pattern: import and call `useWorkspaceTheme()`, add toggle button
- Also apply to the loading state return so the theme is consistent while data loads

### 3. Placement

The toggle button will sit in the top-right of the `<main>` content area on both pages, consistent with how it appears on analysis pages via `AnalysisStepHeader`. A small absolute-positioned or flex-end aligned button.

### Files Modified


| File                            | Change                                  |
| ------------------------------- | --------------------------------------- |
| `src/pages/NewAnalysisPage.tsx` | Add `useWorkspaceTheme` + toggle button |
| `src/pages/WorkspacePage.tsx`   | Add `useWorkspaceTheme` + toggle button |


No changes to landing page, resources, FAQ, pricing, methodology, or other public-facing pages.