# AGENTS.md

Project-level rules for this repo, shared by every coding agent. Framework and library know-how lives in the skills, MCP servers and official docs listed under [Skill, MCP & docs routing](#skill-mcp--docs-routing). This file never restates that content; it records what is specific to **this** codebase.

## Project

Internal mobile app for backoffice users, built with **Expo** (React Native, TypeScript, Expo Router). Expo is the platform: when Expo has a way of doing something — an `expo-*` module, a config plugin, a CLI command — that is the way it is done here. Prioritize mobile-first patterns, performance, and cross-platform (iOS + Android) compatibility. There is no web target.

The backend is the Laravel API — `../api` in a generated project, `../laravel-backend-ai-setup` in the template workspace. The contract between the two is `docs/frontend-integration.md` in the backend repo, and the generated reference is at `/docs/api` on the running backend. That reference is generated from code and cannot go stale, so it wins over anything written here.

The UI is **in Serbian**, because the API's `message` field is written for the end user in Serbian and is meant to be shown verbatim. Do not paraphrase an API message or replace it with wording of your own — see [API boundary](#api-boundary).

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Stack

| Package                         | Version             | Role                                        |
| ------------------------------- | ------------------- | ------------------------------------------- |
| `expo`                          | SDK 58              | platform, native modules, CLI               |
| `react-native`                  | 0.88                | UI runtime                                  |
| `react`                         | 19.3                | UI library, with React Compiler enabled     |
| `expo-router`                   | 58                  | file-based navigation                       |
| `@tanstack/react-query`         | 5                   | server state (async data, cache)            |
| `zustand`                       | 5                   | client state                                |
| `zod`                           | 4                   | runtime validation + inferred types         |
| `typescript`                    | 6                   | types                                       |
| `eslint`                        | 9                   | linting via `eslint-config-expo` + Prettier |
| `prettier`                      | 3                   | formatting                                  |
| `jest` + `jest-expo`            | 30 / 58             | unit and component tests                    |
| `@testing-library/react-native` | 14                  | component queries and user events           |
| `@sentry/react-native`          | 8                   | crash and error reports (release builds)    |
| Maestro CLI                     | 2                   | end-to-end flows on simulator / emulator    |
| Node                            | `^22.13 \|\| ^24.3` | runtime for the CLI                         |

Several of these post-date common training data (Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6, Zod 4, Zustand 5). Do not apply older-major patterns from memory — check the matching skill, MCP or docs first.

## Commands

| Command                           | Notes                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npx expo install <package>`      | **the only way to add or update a package** — resolves SDK-compatible versions; never `npm install <pkg>`                         |
| `npx expo install --check`        | verify every dependency matches the SDK (`--fix` repairs)                                                                         |
| `npm start`                       | dev server (`expo start`)                                                                                                         |
| `npm run start:mcp`               | dev server with the Expo MCP local tools enabled (screenshots, taps, logs)                                                        |
| `npm run ios` / `npm run android` | build the development build and run it on a simulator / emulator (`expo run:*`); Android also runs `adb reverse` for the API port |
| `npm run lint`                    | `expo lint` — ESLint with Expo, React Compiler, hooks and Prettier rules                                                          |
| `npm run format`                  | `prettier --write .`                                                                                                              |
| `npx tsc --noEmit`                | typecheck                                                                                                                         |
| `npx expo-doctor`                 | diagnose dependency and config issues                                                                                             |
| `npm test`                        | Jest — unit, component and route tests (`npm run test:watch` while working)                                                       |
| `maestro test .maestro/<feature>` | E2E flows for one feature, against an app installed on a booted simulator / emulator                                              |

**Definition of done for any code change:** `npm run lint`, `npx tsc --noEmit` and `npm test` pass, and `npx expo install --check` passes when a dependency changed.

**Definition of done for a feature** — on top of the above:

1. **Tests for the feature itself** are written or updated and pass: Jest tests for its logic, schemas, error mapping and screens; a Maestro flow for every user-facing path it adds (happy path and each error the user can hit).
2. **Every other test the change could affect** is run, not only the new ones — the whole Jest suite, plus the Maestro flows of any feature whose code, routes or shared modules were touched.
3. **It is checked on both platforms**: iOS simulator and Android emulator, including the keyboard and safe areas (see [Native feel](#native-feel)).

Run all of it before reporting the task as complete and report what ran. Do not claim it works without having run it; if something could not be run, say so.

## Expo rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation) and git-ignored. Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- **This app does not run in Expo Go** — `react-native-keyboard-controller` is native code Expo Go does not ship. Work in the development build (`expo-dev-client`): `npm run ios` / `npm run android` build it locally; rebuild after adding any library with native code or changing a config plugin. `expo run:*` does not re-apply config plugins to an existing `ios/` / `android/` folder — after changing `plugins` in `app.json` (fonts, splash, permissions), run `npx expo prebuild --clean` first, then rebuild.
- Prefer Expo modules over third-party libraries, and check the available skills before adding a dependency. For UI controls (sheets, pickers, menus, switches), check `@expo/ui` first. Docs: https://docs.expo.dev/versions/latest/index.md
- Environment variables reach the app only with the `EXPO_PUBLIC_` prefix and are inlined at **build** time. Everything with that prefix is readable in the shipped app — nothing secret may ever become one.

## Native feel

This is a native app, and it must feel like one on both platforms. These rules apply to every screen.

- **Safe areas.** Use `react-native-safe-area-context` (`useSafeAreaInsets` / its `SafeAreaView`), never React Native's own `SafeAreaView`. Android is always edge-to-edge, so content goes under the status and navigation bars unless insets are applied. Scroll views under a native header use `contentInsetAdjustmentBehavior="automatic"` instead of manual padding. Check notch / Dynamic Island, home indicator and the Android gesture bar on every screen.
- **Keyboard.** Handle it with `react-native-keyboard-controller` — content moves with the keyboard frame by frame and never jumps or snaps. Forms chain inputs with the return key (`returnKeyType="next"` → focus the next field, `"go"` / `"done"` on the last submits), tapping outside a field dismisses the keyboard, and the focused field plus its submit button stay visible above the keyboard. Never use React Native's `KeyboardAvoidingView` or `softwareKeyboardLayoutMode: "pan"`.
- **Native controls first.** Native stack headers, `NativeTabs`, `@expo/ui` controls and inputs, native menus and sheets. A custom-drawn control needs a reason.
- **Light and dark mode.** `userInterfaceStyle` is `automatic`; every screen must work in both. Navigators take their colors from the `ThemeProvider` in the root layout (`DarkTheme` / `DefaultTheme`, imported from `expo-router` in SDK 58) — without it headers and screen backgrounds stay light in dark mode. Check new screens in both modes (`adb shell cmd uimode night yes|no` on the Android emulator) and with the theme switched inside the app (Profil → Izgled) — a screen must repaint fully, with no text left in the old theme's colors.
- **Every color comes from `usePalette()`** (`features/shared/hooks/use-palette.ts`), called in the component that draws — never a module-level constant, never `Color.android.dynamic.*` / `Color.android.material.*` at render time. On Android those are not live colors: expo-router computes them natively from the configuration of the app's resources, which changes on another thread when the theme changes; a render that runs first bakes the old theme in and React Native never repaints it. The palette gives iOS the dynamic system colors and Android fixed values per scheme.
- **The theme switch** (`features/appearance`) applies `Appearance.setColorScheme`, pushes the scheme into Android's resources and view tree (`applyColorScheme`, so Compose views follow), and runs under a native cross-fade (`modules/theme-transition`, wrapped by `lib/theme-transition.ts`): the window is snapshotted, the theme changes underneath, the snapshot fades out. Never change the scheme without it — the frames in between mix both themes.
- **Platform conventions.** Semantic colors with light and dark mode (through `usePalette()`, see above), SF Symbols on iOS and Material icons on Android, system font sizes that respect Dynamic Type / font scaling. Do not make Android look like iOS or the reverse.
- **Typography.** The typeface is Figtree, embedded at build time by the `expo-font` config plugin in `app.json` (Expo's recommended method — no runtime loading, nothing for the splash screen to wait for). Every piece of text takes its face from `font()` in `features/shared/utils/typography.ts` — React Native `Text`, `@expo/ui` text and inputs (`textStyle`), SwiftUI `font()` modifiers, headers and tab labels. **A weight is selected by naming its face, never with `fontWeight`**: iOS faces are the PostScript names inside the files (`Figtree-SemiBold`), Android faces the file names the plugin registers (`Figtree_600SemiBold`). This is deliberate, not a workaround to undo: `@expo/ui`'s Compose text on Android resolves a custom family to its regular face and ignores `fontWeight`, and Expo's own Compose custom-font example names the face (`'Inter-Bold'`). So never write `fontFamily` or `fontWeight` by hand, and never switch `font()` back to family + weight. A new weight needs its file in the plugin's `fonts`, an entry in `IOS_FACES` and `ANDROID_FACES`, `npx expo prebuild --clean` and a new build; `typography.test.ts` fails until all of them agree.
- **Confirmations are toasts.** A success the user need not act on goes to `useToastStore.getState().show(message)` (the backend's `message`, as it arrives). `ToastHost` in the root layout draws it over the screen with a haptic — never as an inline banner, which shifts the layout when it comes and goes. Errors stay next to what failed.
- **Confirm before losing work or signing out** with `ConfirmDialog` (`features/shared/components`): the system alert on iOS, a Material 3 dialog on Android; back button, back gesture and a tap outside all cancel.
- **Feedback without blocking.** Pending actions disable their own button and show progress there; no full-screen blocking spinners. Errors appear next to what failed.
- **Nothing to show is said in words.** Loading, a failed load, an empty list and a search with no matches each get `ScreenMessage` (`features/shared/components`): an icon, a sentence, at most one action ("Pokušaj ponovo"). A screen that crashes while rendering gets `ErrorScreen` in its place — configured once in `(app)/_layout.tsx` (`unstable_settings.screenErrorBoundary`, keeps the tab bar and headers) and as the root layout's `ErrorBoundary` for anything above the screens.
- **Pictures and the camera — ask only for what is used.** Choosing a picture goes through the system photo picker (`launchImageLibraryAsync` from `expo-image-picker`): it hands over the one photo the user picked and needs **no permission** — never call `requestMediaLibraryPermissionsAsync` for it and never ask for full library access. Only the camera asks, at the moment it is opened, with the reason in the `expo-image-picker` plugin's `cameraPermission` text. Android's storage, media, partial-media and audio permissions are listed in `android.blockedPermissions` in `app.json` so no library can add them back; a feature that truly needs one removes it from there deliberately. A permission the user refused for good (`canAskAgain: false`) gets a dialog that opens the settings app (`Linking.openSettings()`), never a button that silently does nothing.
- **Borders on `@expo/ui` views on iOS** go through SwiftUI modifiers, not the universal `style`: `@expo/ui` maps `borderWidth` + `borderRadius` to SwiftUI's rectangular `border` and then clips it round, which cuts the outline off at the corners. Paint the background in the shape (`background(color, shapes.roundedRectangle(...))`) and the outline with `strokeBorder` along the same shape, in an `.ios.ts` file — see `form-field-appearance.ios.ts`. Android's universal `style` keeps the corners whole.
- **Text input details.** Correct `keyboardType`, `autoComplete` / autofill hints (so password managers work), `autoCapitalize="none"` and `autoCorrect={false}` for emails and identifiers.

## Architecture

**Feature-based.** A feature owns everything it needs; nothing belonging to a feature lives outside its folder. `src/app/` holds routes only and stays thin.

```
src/
  app/                      Expo Router — route files only, no logic
    _layout.tsx             root: providers (QueryClientProvider), auth hydration gate
    (auth)/_layout.tsx      signed-out group
    (app)/_layout.tsx       signed-in group (tabs / stacks)
    (app)/users/index.tsx   a route renders a feature screen and nothing more
  features/
    <feature>/
      screens/              screen bodies rendered by src/app routes
      components/           feature-owned components
      hooks/                use-x.ts, feature-owned
      api/                  typed HTTP calls; responses parsed with this feature's Zod schemas
      query/                TanStack Query: keys.ts + use-x-query.ts / use-x-mutations.ts, wrapping api/
      testing/              fixtures.ts — sample data the feature's tests share (never imported by app code)
      stores/               optional — feature-local client state (Zustand)
      schemas/              Zod schemas + their z.infer types
      utils/                pure helpers the feature owns
      types.ts              types not derived from a schema
    shared/                 same structure — our code used in more than two features
  lib/                      configured third-party libraries, one module per library
    http.ts                 the single HTTP client over expo/fetch: base URL, bearer token, 401 handling, ApiError
    query-client.ts         the QueryClient and its defaults
    secure-store.ts         token storage over expo-secure-store
    storage.ts              small non-secret device values over expo-sqlite/kv-store (sync reads)
    zustand.ts              `create` (reset on sign-out) and `createDeviceStore` (kept)
    theme-transition.ts     our theme-transition native module, wrapped like any native dependency
    sentry.ts               error reports: init, root wrapper, reportError, the signed-in user's id
modules/                    our own native code — local Expo modules (Swift + Kotlin, Expo Modules API),
                            scaffolded with `npx create-expo-module --local`; app code reaches them via lib/
```

Create directories on demand; do not scatter equivalents elsewhere.

### Feature rules

- The feature folder is the unit of ownership. **No cross-feature imports** — if `users` needs something from `auth`, that something moves to `features/shared/` first. Promote code to `shared/` on the third use, not pre-emptively.
- The root layout decides between `(app)` and `(auth)` with `Stack.Protected`, and each guard has an explicit `redirectTo` (SDK 58+) — `/` belongs to `(app)`, so without it a signed-out launch resolves to _Unmatched Route_. Screens never navigate after a login or logout; changing the session status is enough.
- The root navigator renders nothing while the stored token is being checked (the splash covers it). Rendering the guards early treats the user as signed out and redirects a launch URL — a link, later a notification — to the login, losing it. `src/__tests__/auth-routing.test.tsx` holds this.
- **Reference feature: `users`** — the web's users CRUD on mobile, and the pattern for any resource:
  - read: list with search and pull to refresh, detail with the list row (or the session) as placeholder data, 404 and bad-param states;
  - write: create / edit form in a modal (`user-form/new`, `user-form/[id]` in `(app)`), one's own profile edited through the same form;
  - actions: the header's native `Stack.Toolbar.Menu`, offered by a pure rules function (`utils/user-actions.ts`, mirroring the web's), each confirmed with `ConfirmDialog`, the backend's message as a toast, a refusal shown on screen;
  - paginated lists (`useInfiniteQuery` + `nextPage(meta)`, next page on `onEndReached`) — the audit trails.
    New features mirror it — the `new-feature` skill walks through the steps.
- **Client-only features:** `shortcuts` (per-account history in a `create` store, persisted per user id, counted from `usePathname` in `(app)/_layout.tsx`) and `appearance` (theme in a `createDeviceStore`, applied with `Appearance.setColorScheme` before the first frame). Device preferences survive sign-out; anything about a person must not.
- **This phone and push (`notifications`)** — internal users only. Login sends `device` (`features/shared/api/device.ts`, built from `lib/device.ts`); the signed-in layout runs `usePushRegistration`, which `PUT /auth/device`s the phone on every launch with the push token three-state (omitted = keep, `null` = off, string = on), and asks for permission automatically once per install (`shouldAskAutomatically`). Asking does not depend on configuration; getting a token needs `EAS_PROJECT_ID`, read by `app.config.ts` — never write the id or an `owner` into `app.json`, the template stays bound to no account. Setting a project up: `docs/push-notifications.md`. Logout needs no device call — the backend unbinds the phone when the token goes.
- **Error reports (Sentry)** go through `lib/sentry.ts`, never the bare package. Uncaught JS errors and native crashes are caught by the SDK; `ErrorScreen` reports what a boundary caught; `reportQueryError` in `lib/query-client.ts` reports failed calls that are bugs — a 5xx (tagged `request_id`) or anything not an `ApiError` (a Zod mismatch, our own throw) — and never a 4xx or a network failure. A new `catch` that swallows a bug calls `reportError`; one that handles an expected answer does not. Only the user's id is attached, never e-mail or other personal data. Nothing is sent from a development build or without `EXPO_PUBLIC_SENTRY_DSN`; the DSN, `SENTRY_ORG` and `SENTRY_PROJECT` come from the environment through `app.config.ts` — never write them into `app.json`, and `SENTRY_AUTH_TOKEN` into no file at all. Setting a project up: `docs/sentry.md`.
- A query-key root that more than one feature touches (`users`: profile edits change a row in it) lives in `features/shared/query/keys.ts`; the owning feature builds its keys on it, the other invalidates it.
- `(app)/_layout.tsx` is a Stack holding `(tabs)` and the modals. Declare a modal there (`presentation: 'modal'`), not inside a tab's stack — inside a tab it opens within the tab and the tab bar stays visible.
- `NativeTabs` import from `expo-router/native-tabs`. The `expo-router/unstable-native-tabs` path some docs and skills still show is deprecated in SDK 58.
- Route files in `src/app/` render a screen from `features/<feature>/screens/` and only read route params. No business logic, no data fetching, no markup that belongs in a screen or component. When one screen needs a piece another feature owns, **the route composes them** — the screen takes a slot prop and the route fills it (`(profile)/profile.tsx` renders `<ProfileScreen footer={<SignOutSection />} />`: the profile is `profile`'s, sign-out is `auth`'s). The route is the one place two features meet; neither imports the other.
- `<Link asChild>` passes its child's `style` through untouched: give the child one plain object (`StyleSheet.flatten`), never an array or a `({ pressed }) => …` function — the style is silently dropped. Draw a pressed state in the child's content instead.
- `api/` returns parsed, typed data. `query/` wraps it in `useQuery` / `useMutation` and owns the query keys (nested under one root per feature, so a write invalidates the whole feature by prefix). Screens and components call `query/`, never `api/` directly.
- `src/lib/` is the only place a third-party library is configured — one module per library, no domain knowledge (no endpoints, schemas, or feature types). Feature code imports the `lib/` module, never the bare package, and never calls raw `fetch`.
- `lib/` wraps **someone else's** code; `features/shared/` holds **our** code. A file that imports from `features/` does not belong in `lib/`.

### API boundary

`src/lib/http.ts` is the one place that knows the API exists: base URL from `EXPO_PUBLIC_API_URL`, the bearer token, and the conversion of every failure into an `ApiError`.

- **Sanctum personal access tokens, not cookies.** No CSRF, no `/sanctum/csrf-cookie`, no credentials mode.
- Successful responses share one envelope (`{ message, data }`); errors keep Laravel's shape. Branch on **HTTP status**, never on the body's shape.
- `message` is written by the backend for the end user. Show it as it arrives; do not invent replacement copy. A 422 maps onto the form fields it names.
- Request field names are the API's (snake_case included) all the way into the Zod schemas and form fields, so a 422 lands on its field without a lookup table.
- The **token lives in expo-secure-store** (never AsyncStorage); the **user lives in memory only**. On launch the root layout trades the token for `GET /auth/me` and renders nothing (splash) until that resolves, then routes to `(auth)` or `(app)`. Never persist the user: a cached role outlives the server's opinion of it. The iOS Keychain survives an uninstall, so `lib/secure-store.ts` ignores (and deletes) a token until this install has written its marker in `lib/storage` — a reinstalled app always starts signed out. Keep every token read going through `readToken()`.
- `EXPO_PUBLIC_API_URL` comes from `.env.local` (copy `.env.example`). `localhost` is the device's own loopback: the iOS simulator shares the Mac's, and `npm run android` maps the emulator's port 8000 to the Mac with `adb reverse`, so `http://localhost:8000/api` works on both. A physical device needs the Mac's LAN address.
- Hiding a control a user may not press is a courtesy; the API answers 403 regardless.

### Conventions

- Import with the `@/*` alias (→ `./src/*`). No deep `../../` chains.
- File names are kebab-case (`user-card.tsx`, `use-users-query.ts`); components inside are `PascalCase`, one named export per component file. Route files follow Expo Router naming.
- `StyleSheet.create` sits at the bottom of the component file, not in a separate styles file.
- Platform differences: `Platform.select` for small ones; `.ios.tsx` / `.android.tsx` files for large ones, always with a default file.
- `noUncheckedIndexedAccess` is enabled: indexed access yields `T | undefined` — handle it instead of asserting with `!`.

## Library rules

These are project decisions that no skill covers — follow them exactly.

### React

- Function components and hooks that follow the [Rules of React](https://react.dev/reference/rules).
- **React Compiler is enabled** (`experiments.reactCompiler` in `app.json`) and memoizes components and hooks automatically. Do not write `useMemo`, `useCallback`, or `React.memo` for performance. If a component genuinely cannot be compiled, opt it out with `'use no memo'` and say why in a comment.
- The lint rules for the compiler and hooks are part of `npm run lint`. A violation is a bug to fix, not a rule to disable.

### TanStack Query vs Zustand

- Anything fetched from a server → `useQuery` / `useMutation` / `useInfiniteQuery`, defined in the feature's `query/` folder.
- Never hand-roll fetch-and-cache inside a Zustand store, and never mirror query results into store state. Zustand is for client-only state: UI state, drafts, preferences, cross-screen coordination.
- Persisted client state goes through `lib/storage.ts` (never AsyncStorage directly, never secrets) and is parsed with Zod on the way back in — an older version may have written another shape. A store about the signed-in person uses `create` and keys its storage by user id; a device setting uses `createDeviceStore`.
- Global Query defaults live in `src/lib/query-client.ts`. Tune per query at the call site rather than changing the global default.
- `src/lib/query-client.ts` also connects `focusManager` to `AppState` and `onlineManager` to NetInfo — React Native has no browser focus or online events, and without them stale data is never refetched when the app returns to the foreground or the network comes back. Do not remove them; do not add per-screen `AppState` refetching either.
- Every data screen designs four states — loading, error, empty, content — per the `expo-data-fetching` skill.

### Zod

- Every external boundary is parsed, not cast: API responses, form input, route params, env.
- Schemas live in the owning feature's `schemas/` folder (`features/shared/schemas/` when shared); derive types with `z.infer` and export them from there. Never hand-write a TS interface that duplicates a schema — `types.ts` is only for types no schema produces.

## Testing

Two layers, split by purpose: Jest covers logic and component behaviour, Maestro covers user flows across screens on a real simulator. Do not duplicate the same assertion across both.

**Unit / component / route (Jest + `jest-expo` + React Native Testing Library)** — colocated next to the file under test as `<name>.test.ts(x)`:

```
src/lib/http.test.ts
src/features/shared/utils/api-errors.test.ts
src/features/auth/schemas/credentials.test.ts
src/features/auth/screens/login-screen.test.tsx
```

- **Never put a test inside `src/app/`** — every file there becomes a route. Tests that need the router (redirects, guards, the auth flow) live in `src/__tests__/` and use `renderRouter` from `expo-router/testing-library` against the real `./src/app` directory.
- `@expo/ui` controls render as native views, and Jest cannot type into them or read their labels. Keep a screen's behaviour in a hook (`features/<feature>/hooks/use-x-form.ts`) and test the hook with `renderHook`; test the screen for what it shows; cover the typing and tapping with a Maestro flow. A button Jest must press gets a `testID` (`ScreenMessage` derives `<testID>-action`).
- Jest runs as iOS (`jest-expo`): a component split into `.ios.tsx` / `.android.tsx` is tested in its iOS form. Test the state behind a native control; Maestro presses it on both platforms.
- Query by what the user sees (`getByRole`, `getByLabelText`, `getByText`) and interact with `userEvent`; `testID` is the last resort.
- Mock the network at `src/lib/http.ts` or `fetch`, never inside feature code. A test never reaches a real backend.

**E2E (Maestro)** — YAML flows outside `src/`, one folder per feature:

```
.maestro/auth/login.yaml
.maestro/auth/invalid-credentials.yaml
```

- Flows run against the app installed on a booted simulator / emulator (`npm run ios` / `npm run android`) talking to the **live local backend**, so the backend must be up with its demo data.
- `appId` in each flow is `ios.bundleIdentifier` / `android.package` from `app.json`.
- Before running flows on an Android emulator, turn off stylus handwriting once: `adb shell settings put secure stylus_handwriting_enabled 0`. Otherwise a tap into a text field sometimes opens handwriting mode instead of the keyboard, and the next step fails for no reason in the app.
- Select elements by visible text or accessibility label, the same way a user finds them. Anything a flow must see must be an accessibility element — `pointerEvents="none"` drops a view from the Android accessibility tree, for TalkBack and Maestro alike.
- To replace a field's text, tap its right-hand end (`point: '95%,50%'`) and then `eraseText: 100`; a plain tap puts the cursor mid-text and only part of it is erased.
- The demo database is shared. A flow that writes restores what it changed in `onFlowComplete` with a script in `.maestro/scripts/` (runs on the host, pass or fail), signing in with an account the flow does not modify.
- **Every flow passes on both platforms** (`maestro --platform ios|android test .maestro`). Where the platforms differ, branch with `runFlow: when: platform: …` and say why in a comment. Known differences: `back` exists only on Android (an iOS alert closes with its cancel button); on iOS the screen's own button stays in the hierarchy behind an alert, so a dialog button that shares its label is picked as the last match (`index: 1` — the alert is drawn last); `below: '<question>'` breaks as soon as the screen's layout moves its button under the question; a view marked `accessible` hides its child texts on iOS (assert its label instead); from iOS 27 the system photo picker and crop screen run out of process and are invisible to Maestro, so they are tapped by position. Assert lasting state rather than a toast when earlier steps may outlast it. A toast covers the header for about three seconds: tap it away before using a header button or menu.
- On Android Maestro also sees the texts inside a single accessible element (a row, a tile) — iOS does not. When such an inner text equals another element's label (a shortcut tile titled like a tab), pick the element explicitly per platform (`index`, `below:`), and say why.
- A flow that creates records gives them a unique value (`evalScript: ${output.email = 'maestro.' + Date.now() + '@…'}`) and cleans up after itself in `onFlowComplete` as far as the API allows.
- A flow that writes also resets in `onFlowStart`, so a run that died half-way does not break the next one.
- Start the Android emulator with `-no-audio` (`emulator -avd <name> -no-audio`): with audio on, it can hang in macOS CoreAudio and get killed by its own hang detector mid-run.

## Skill, MCP & docs routing

Load the listed source for the task instead of working from memory. Their content is deliberately not repeated here.

| Task                                                       | Load                                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Any Expo / EAS task, or unsure which skill applies         | `expo-overview` skill first — it routes to the right `expo-*` / `eas-*` skill                                |
| Navigation, layouts, headers, tabs, modals                 | `expo-router`                                                                                                |
| Screens, styling, native look                              | `expo-native-ui` + `expo-ui`                                                                                 |
| Theme, design tokens, consistent components                | `expo-design-system`                                                                                         |
| Animations, gestures, haptics                              | `expo-animation`                                                                                             |
| HTTP, TanStack Query, auth tokens, offline                 | `expo-data-fetching`                                                                                         |
| Performance: re-renders, FPS, lists, startup, bundle size  | `react-native-best-practices`                                                                                |
| Builds, store submission, OTA updates, CI                  | `eas-app-stores`, `eas-update`, `eas-workflows`, `expo-dev-client`                                           |
| Adding a feature (screen, list, detail, form)              | `new-feature` skill (this repo) — mirrors `users` / `profile`                                                |
| Jest / component tests                                     | `react-native-testing` (RNTL v14) + https://docs.expo.dev/router/reference/testing.md for route tests        |
| E2E flows, driving a simulator                             | **`maestro` MCP** + https://docs.maestro.dev                                                                 |
| SDK upgrade                                                | `expo-upgrade`                                                                                               |
| Expo docs, EAS builds, simulator screenshots / taps / logs | **`expo` MCP** (local tools need `npm run start:mcp`)                                                        |
| Zod schemas                                                | **`zod` MCP** — there is no Zod skill                                                                        |
| TanStack Query                                             | no skill or MCP exists — https://tanstack.com/query/latest/llms.txt and the React Native page linked from it |
| Zustand                                                    | no skill or MCP exists — https://zustand.docs.pmnd.rs/llms.txt                                               |
| React / React Native APIs                                  | https://react.dev/llms.txt, https://reactnative.dev/llms.txt                                                 |

Rules:

- Do not copy skill content into this file; add a pointer instead.
- If a rule here conflicts with a skill, this file wins — it describes this repo.
- The Expo skills and the `expo` MCP come from the Expo plugin (`expo@claude-plugins-official`), enabled in `.claude/settings.json`; each developer installs it once with `claude plugin install expo@claude-plugins-official`.
- Other skills under `.claude/skills/` are vendored and tracked in `skills-lock.json`. Do not hand-edit them; update them through their source with `npx skills update`. `.claude/skills/` is the only skill location — if an installer creates `.agents/skills/`, delete it.
- The MCP servers are declared in `.mcp.json`, which only Claude Code reads. An agent without skill support reads the same content directly at `.claude/skills/<name>/SKILL.md`, and registers the MCP equivalents in its own client's config before relying on a row that says "MCP". Where an MCP is unavailable, use the vendor's published docs; do not fall back to memory.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `npx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples. Docs: https://docs.expo.dev/eas/index.md

Never run `eas init` in the template: it binds the project to one Expo account. Each generated project runs it once, under the team's Expo organization.

**Three app variants** (`docs/builds.md`): `APP_VARIANT` = `development` | `preview` | `production`, read by `app.config.ts`. Each has its own bundle id / package (`.dev`, `.preview` suffix on `app.json`'s production id), name suffix (`(Dev)`, `(Test)`) and URL scheme, so all three install side by side; the variant also picks the Sentry environment (`extra.appVariant`) and the iOS push environment. `.env.local` sets `development`, so local work (`npm run ios` / `android`, Maestro flows on `<id>.dev`) is always the dev app; each `eas.json` profile sets its own variant and EAS environment; unset means `production`. Never hard-code a variant's id elsewhere — derive it in `app.config.ts`. Switching the variant of an existing `ios/` / `android/` folder needs `npx expo prebuild --clean`. Builds: `npm run build:dev` / `build:preview` / `build:production`, `npm run submit:production`.

**Updates** (`docs/updates.md`): `expo-updates` with `runtimeVersion: { policy: 'appVersion' }` and one channel per variant (`preview`, `production` in `eas.json`); off without `EAS_PROJECT_ID`. Publish only with `npm run update:preview` / `update:production` — they set `APP_VARIANT` and `--environment`; a bare `eas update` ships production's config and `.env.local`'s API URL. **Any native change — a package with native code, a config plugin or its options, permissions, icons, an SDK upgrade — bumps `version` in `app.json`**, or an OTA update can reach a build without that native code. Separately, `UpdateRequiredGate` (`src/features/app-version/`) wraps the whole app: it asks the public `GET /mobile/app-version/internal/{platform}` on launch (`internal` = this app; the external app has its own minimum) and on every return to the foreground, and an app older than the server's `minimum_version` shows only "update required". It fails open — offline, a server error or a value that is not a version lets the app run. Signing out (`endSession`) removes every query except those marked `meta: { keepOnSignOut: true }` — a query that belongs to the app rather than the user, like this one, must carry it; removing a query a mounted component watches leaves that component waiting forever. Mock `@/features/app-version/api/app-version` in tests that render the real root layout.

## House style

Prettier (`.prettierrc`, Expo's own style): single quotes, semicolons, print width 100, `trailingComma: es5`. Do not fight the formatter — run `npm run format`. Write comments only where the reason for the code is not obvious from the code.
