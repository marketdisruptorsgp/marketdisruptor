
# Save Password Checkbox + Button Visibility Improvements

## 1. "Remember Me" Checkbox on Password Login

Add a "Remember me" checkbox to the password sign-in form that saves the user's email to `localStorage`. When they return, the email field is pre-filled so they only need to type their password.

**How it works:**
- A styled checkbox appears between the password field and the Sign In button
- When checked and login succeeds, the email is saved to `localStorage` under `saved_login_email`
- On page load, if a saved email exists, it pre-fills the email field, auto-switches to password mode, and focuses the password field
- Unchecking and logging in clears the saved email

**File: `src/pages/AuthPage.tsx`**
- Add `rememberMe` state (boolean), initialized from whether `localStorage` has `saved_login_email`
- Add `useEffect` to load saved email on mount and auto-switch to password mode
- Add a checkbox row (using the existing Checkbox component from `@radix-ui/react-checkbox`) between the password input and the submit button
- On successful password login: if `rememberMe` is true, save email; if false, clear it

## 2. Button & Navigation Visibility Improvements

Audit and upgrade all interactive elements to ensure they're unmissable.

**File: `src/pages/AuthPage.tsx`**
- Increase submit button height from `py-3` to `py-3.5`
- Add a subtle shadow (`shadow-md`) to make the CTA pop against the background
- Make the mode toggle buttons slightly taller (`py-3` instead of `py-2.5`) with bolder text

**File: `src/components/PlatformNav.tsx`**
- Increase nav text from `text-sm` to `text-sm font-semibold` for top-level nav triggers (Access Modes, Workspace, Resources)
- Make the "About" and "Pricing" direct links use `font-semibold` consistently
- Add a subtle bottom border indicator on the active page link (2px primary-colored underline)

**File: `src/components/StepNavigator.tsx`**
- Increase step button padding from `px-3 py-2` to `px-4 py-2.5`
- Make the active step more prominent with a slight shadow
- Increase the connector line width from `w-4` to `w-6` for better visual flow

## Technical Details

| File | Changes |
|---|---|
| `src/pages/AuthPage.tsx` | Add `rememberMe` state + checkbox UI, load saved email on mount, save/clear on login, increase button sizing and add shadow |
| `src/components/PlatformNav.tsx` | Bump nav trigger font weight to semibold, add active-page bottom border indicator |
| `src/components/StepNavigator.tsx` | Increase button padding, add shadow on active step, widen connector lines |
