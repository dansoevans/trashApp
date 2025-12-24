<!-- .github/copilot-instructions.md - guidance for AI coding agents working on this repo -->
# Copilot / AI agent instructions

Purpose: Short, actionable guidance so an AI can be immediately productive in this Expo + Firebase TypeScript app.

- **Big picture:** This is an Expo app using file-based routing (Expo Router) and Firebase as the backend. UI lives under `app/` (routes + screens), global providers in `providers/`, domain logic in `services/`, and shared UI in `components/`.
  - Entry & routing: [app/index.tsx](app/index.tsx) and file-based routes in `app/` (see grouped routes like `(auth)` directories such as [app/(auth)/login.tsx](app/(auth)/login.tsx)).
  - App scaffolding & providers: [providers/AppProviders.tsx](providers/AppProviders.tsx) wraps fonts and `ThemeProvider`.
  - Backend integration: Firebase is used directly from `services/*` via [Firebase/firebaseConfig.ts](Firebase/firebaseConfig.ts) and Firestore calls in `services/requestService.ts` and `services/authService.ts`.

- **Primary workflows / commands** (use these exactly):
  - Install deps: `npm install`
  - Start: `npx expo start` (or `npm run start`)
  - Run on Android emulator/device: `npm run android` (calls `expo run:android`)
  - Run on iOS simulator/device: `npm run ios` (calls `expo run:ios`)
  - Web: `npm run web`
  - Reset starter project: `npm run reset-project` (see `scripts/reset-project.js`)
  - EAS builds: project includes `eas.json`; use `eas build` as needed (credentials and EAS setup are external).

- **Code patterns & conventions (concrete, discoverable):**
  - File-based routing: screens are under `app/`. Parenthesized directories are route groups (e.g., `(auth)`, `(tabs)`). Keep route components default-exporting React components.
  - Services: keep Firebase logic in `services/*.ts` (example: `requestService.ts` uses Firestore queries and `serverTimestamp()`; `authService.ts` consolidates auth flows). Prefer adding new server interactions here.
  - Singletons: `authService` uses a singleton pattern and also exports helper functions for backward compatibility — follow that style when adding app-wide managers.
  - Providers: wrap app-level concerns (fonts, theme, etc.) in `providers/AppProviders.tsx` — add global contexts here.
  - TypeScript-first: use declared types from `types/` (e.g., `PickupRequest`, `UserProfile`) and export new types there.
  - AsyncStorage session keys: `services/authService.ts` uses defined `SESSION_KEYS` — reuse same keys or extend cautiously.

- **Where to change behavior / add features:**
  - UI routes/components: `app/` — add or adjust pages and use file-based routing conventions.
  - Business logic & persistence: `services/*` — add Firestore access or notification writes here (see `notifyCollector` in `requestService.ts`).
  - Theme + styling: `theme/ThemeContext.tsx` and `constants/theme.ts`.
  - Hooks: prefer `hooks/*` for reusable logic (e.g., `useRequests.ts`).

- **Testing & debugging tips specific to this repo:**
  - Expo logs: use the Metro/Expo CLI (`npx expo start`) to view runtime logs. For native crashes, check device/emulator logs.
  - Firebase: local testing requires valid Firebase config in `Firebase/firebaseConfig.ts` and appropriate Firestore rules and credentials; avoid committing secrets.
  - EAS: if `eas build` fails, verify `eas.json` and project credentials (these are external to the repo).

- **Common pitfalls observed in the codebase:**
  - Time slot checks: `requestService.submitRequest` double-checks slots before adding — preserve this pattern to avoid race conditions.
  - Auth flow: `authService` both exposes a singleton and utility functions; when modifying, keep both styles for compatibility.
  - Route grouping: adding or renaming directories under `app/` changes routes; maintain correct export defaults.

- **When making PRs or edits:**
  - Keep changes focused: modify only the files required for the change.
  - Preserve existing export styles and singleton patterns in `services/`.
  - Reference relevant files in PR descriptions (examples: `app/`, `services/`, `providers/`).

If anything here is unclear or you'd like more detail on a specific area (routing, Firebase rules, or EAS config), tell me which part to expand.
