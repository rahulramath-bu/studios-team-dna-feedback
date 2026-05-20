# Porting Team DNA to the Monolith

Date started: May 19, 2026

Audience: BetterUp product engineers, or an AI assistant helping those engineers, who need to move this standalone Team DNA prototype into the BetterUp monolith.

This is a porting guide, not a design diary. It should explain the seams that matter when integrating with the monolith: routing, layout, data, design-system tokens, assets, dependencies, and prototype-only code that should not ship.

For the deeper content philosophy behind deterministic fallback versus future AI synthesis, read [ai-synthesis-layer-philosophy.md](./ai-synthesis-layer-philosophy.md).

## One-sentence target

Port `TeamDnaExperience` as the Team DNA tab panel inside the real BetterUp Team area. Let the monolith own the product shell, route, feature gates, API hooks, analytics, and global design-system styles.

## Monolith references to check first

These paths were checked against `/Users/preetoshi/Documents/BetterUp Monolith` and are the best current anchors:

- `ux/apps/react-platform/src/member/team-tooling/routers/TeamToolingRouter.tsx`
  - Current Team area shell is `MemberNavbar` plus an `Outlet`, wrapped by `TeamToolingGate`.
- `ux/apps/react-platform/src/member/team-tooling/pages/TeamToolingHome.tsx`
  - Uses generated API hooks, `BrowserTitle`, `Heading`, `Text`, `Button`, `Icon`, and route navigation.
- `ux/packages/component-library/src/components/ui/page-tabs.tsx`
  - Closest canonical subtab primitive if Team DNA lives beside Overview, Team Pulse, Team Coaching, etc.
- `ux/apps/react-platform/src/styles/index.css`
  - Imports component-library `tokens.css` and `theme.css`, and defines the global BetterUp font faces.
- `ux/apps/react-platform/tailwind.config.js`
  - Defines `font-body`, `font-heading`, `font-display`, `font-mono`, `rubine`, `midnight`, and semantic token colors.
- `ux/packages/core-react/src/components/WBAvatar/WBAvatar.tsx`
  - Existing BetterUp avatar wrapper if the port should use the product avatar primitive.
- `ux/apps/react-platform/package.json`
  - Already depends on `motion`, so Team DNA should import from `motion/react`.

The monolith has several UI eras. For this feature, prefer React Platform plus `@betterup/component-library`, `@betterup/icons`, generated `@betterup/api` hooks, and token-backed styling. Do not copy Ember, Bootstrap, or legacy `.wb-btn-*` patterns just because they exist nearby.

## What to port

Copy the Team DNA feature code, then adapt it to TypeScript/monolith conventions as needed:

- `src/team-dna/TeamDnaExperience.jsx`
- `src/team-dna/components/TeamFaceField.jsx`
- `src/team-dna/components/TeamFace.jsx`
- `src/team-dna/components/DuoConnection.jsx`
- `src/team-dna/components/BigFiveBloom.jsx`
- `src/team-dna/components/BigFiveSpectrumList.jsx`
- `src/team-dna/components/InsightPanel.jsx`
- `src/team-dna/components/InfoBlock.jsx`
- `src/team-dna/hooks/useTeamDnaSelection.js`
- `src/team-dna/hooks/useTeamDnaPressable.js`, unless a shared BetterUp pressable primitive exists by then
- `src/team-dna/data/teamDnaAdapter.js`, as the adapter pattern, not as the final data source
- `src/team-dna/data/bigFiveTraits.js`, as UI metadata for trait labels/endpoints/colors
- `src/team-dna/data/teamDnaIds.js`
- `src/team-dna/data/teamDnaPairInsights.js`, only as deterministic fallback/demo insight generation
- Team DNA CSS rules from `src/styles.css`, converted into the monolith's preferred CSS/module/Tailwind structure

The most important rule: keep the route/page layer thin. The route fetches or receives data, normalizes it once, and passes a simple view model into `TeamDnaExperience`.

## What not to port

These files and assets exist only so this standalone repo can demo the feature:

- `src/team-dna/TeamDnaPage.jsx`
  - Useful as a local harness, but the monolith route should replace it.
- `src/team-dna/dev/MonolithTeamShell.jsx`
  - Debug visual shell only. Use the real monolith `MemberNavbar`, route layout, and tabs.
- `src/team-dna/dev/TeamDnaDevPanel.jsx`
- `src/team-dna/dev/teamDnaDevState.js`
- `public/frontend/assets/fonts/**`
  - Local mirrors of monolith font assets. The monolith already defines fonts globally.
- `public/team-dna/monolith/betterup-logotype-rebrand.svg`
  - Used only by the debug shell preview.
- Fixture avatars in `public/team-dna/avatars/**`
  - Fine for Storybook/tests if needed, not production data.

## Routing and shell seam

Team DNA should not bring its own product shell.

Expected monolith ownership:

- `TeamToolingGate` or the future Team gate controls access.
- `MemberNavbar` remains the real top nav.
- The Team tab/subtab layout owns Overview, Team Pulse, Team DNA, and any sibling tabs.
- `PageTabs` is the current component-library candidate for subtabs when those tabs are in-page state; use route-driven tabs if the product wants URL-addressable subtabs.
- `BrowserTitle`, analytics events, loading, and error states belong at the route/page layer.

Current likely path if no broader Team subtab shell exists yet:

```txt
/platform/member/team-tooling/team-dna
```

If Product creates a broader Team tab shell, mount Team DNA as one sibling panel inside that shell instead. Do not add a separate "Team Flighthouse" header above the subtabs. Team name and Team DNA narrative belong inside the Team DNA panel unless Product explicitly changes the surrounding IA.

## Layout seam

The standalone app owns the whole viewport. The monolith version should not assume that.

Porting expectations:

- The shell provides the available tab-panel surface.
- `TeamDnaExperience` centers the left people field and right insight panel as one composition.
- The distance between the two panes should stay stable; extra width belongs outside the composition, not between panes.
- The left people field is sticky/centered on desktop.
- The right insight panel owns its own scroll area and scroll fades.
- The document body should not become the Team DNA scroll container.

Current standalone CSS uses `100vh` for `.team-dna-page`, `.team-dna-experience`, `.team-dna-people-pane`, and `.team-dna-insight-pane`. In the monolith, replace those viewport assumptions with the real route/tab-panel height, usually a flex child or `calc(100vh - nav/subtab chrome)` depending on the final shell.

Mobile is not finished. View 1 stacks on small screens, but the likely future mobile pass is View 2: a horizontal face rail above a vertical insight stack. Keep the data and face components reusable so that pass does not require rewriting insight logic.

## Data seam

The prototype uses fixture data. The monolith should use generated API hooks or route-provided data, then normalize once into this view model.

Minimum Team DNA view model:

```ts
type TeamDnaDataset = {
  team: {
    id: string;
    name: string;
    meta?: Record<string, unknown>;
  };
  members: TeamDnaMember[];
  insights: {
    team?: TeamDnaInsight;
    people?: Record<string, TeamDnaInsight>;
    pairs?: Record<string, TeamDnaInsight>;
  };
};

type TeamDnaMember = {
  id: string;
  name: string;
  pronouns?: {
    subject: string; // "she", "he", "they"
    object: string; // "her", "him", "them"
    possessive: string; // "her", "his", "their"
  };
  role?: string;
  avatarUrl?: string | null;
  assessmentComplete: boolean;
  bigFive?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  meta?: Record<string, unknown>;
};

type TeamDnaInsight = {
  id: string;
  source?: 'deterministic' | 'ai' | 'override';
  generatedAt?: string;
  inputVersion?: string;
  eyebrow: string;
  title: string;
  summary: Array<{ text: string; emphasis?: boolean }>;
  cards: Array<{
    id: string;
    label: string;
    kind?: string;
    showLabel?: boolean;
    data?: unknown;
  }>;
};
```

Do not leak backend field names into JSX components. Keep that mapping in one adapter near the API hook.

Pronouns are display-language data, not gender data. Pass them when the monolith has them; otherwise omit the field and deterministic copy falls back to neutral `they/them`.

Current local seam:

- `getTeamDna()` returns fixture data.
- `getInsightForSelection(dataset, selectedIds)` resolves team/person/duo insight for the current selection.
- `buildTeamInsight()`, `buildPersonInsight()`, and `buildPairInsight()` generate readable copy from normalized scores by default.
- `source: 'ai'` fixture records mimic future backend synthesis and use the same `TeamDnaInsight` shape as deterministic fallback.
- `makePairId()` makes pair IDs deterministic and order-insensitive.

Monolith target:

- Replace `getTeamDna()` with generated API hooks from `@betterup/api/src/member/@tanstack/react-query.gen`.
- Keep a small `mapTeamDnaResponseToViewModel()` next to the query.
- If the backend only returns member trait data at first, deterministic insight helpers are enough to render complete team, person, and duo pages.
- If the backend or a content service returns approved insight copy, map it as an explicit override into the same `TeamDnaInsight` shape. Do not make handcrafted fixture copy a required input.
- Keep unknown or future fields under `meta` until a real component needs them.

This keeps future additions easy: role data, profile links, assessment status, Big Five, Big Why dimensions, Bloom data, and supporting-card payloads can all enter through the adapter without making the face cluster or insight panel know API details.

## Big Five visualization seam

The current visualization contract is intentionally small:

- Members carry normalized `bigFive` scores from 0 to 100.
- `bigFiveTraits.js` owns UI metadata: trait order, strength-framed labels, spectrum endpoints, and colors.
- `BigFiveBloom` accepts `subjects` and optional `traits`; it currently renders one-person and duo overlays.
- `BigFiveSpectrumList` accepts `subjects` and optional `traits`; it can render one dot, two dots, or many dots per row.

Do not make these visualization components API-aware. If the backend later sends Big Why, role data, richer assessment facets, or a different score scale, normalize that once in the route/adapter and keep these props stable.

The spectrum endpoint copy is intentionally strengths-based, but it should not flatter its way out of accuracy. Avoid low/high labels where one side sounds like the "good" side and the other sounds deficient or misleading. For example, `Direct` to `Warm` is safer than implying low agreeableness means "not cooperative," and `Spontaneous` to `Methodical` is safer than calling low conscientiousness "adaptive."

Current card mapping:

- Team view: first card is `bigFiveSpectrumList` for the whole team. No team aggregate Bloom is shown yet.
- Person view: first card is `bigFiveBloom`, second card is `bigFiveSpectrumList`.
- Duo view: first card is `bigFiveBloom`, second card is `bigFiveSpectrumList`.

## Selection contract

Selection is intentionally simple and should stay ID-based:

- `[]` means team view.
- `[memberId]` means individual view.
- `[firstMemberId, secondMemberId]` means duo view.

When a third person is chosen, the first selected person stays anchored and the second slot changes. Pair insight lookup must remain order-insensitive.

Members with `assessmentComplete === false` should appear in the team field but should not enter person/duo insight state. The current prototype gives a small blocked interaction. In the monolith, the important product rule is: visible teammate, not comparable yet.

## Edit and mutation seam

The standalone edit mode is prototype-only persistence.

Current local behavior:

- Team name can change in memory.
- Members can be added/removed in memory.
- New members enter without avatar and without completed assessment.

Monolith target:

- Replace local `updateTeamName`, `addMember`, and `removeMember` with real mutations, or remove/disable edit mode if roster management belongs somewhere else.
- Keep edit UI thin. It should call route-level mutation handlers and let query invalidation/refetch update the view model.
- Do not make `TeamFaceField` responsible for persistence.

## Design-system seam

The standalone CSS intentionally mirrors monolith token names so the port can remove local fallbacks instead of renaming every style.

Important mappings:

- Body font: use monolith `font-body` / `Söhne`.
- Display title font: use monolith `font-display` / `--heading-display-font`, not `font-heading` if the design calls for `Ivar Display`.
- Mono labels: use monolith `font-mono` / `Söhne Mono`.
- Rubine: use `rubine`, `--rubine`, or semantic `--primary` where appropriate.
- Midnight: use `midnight` / `--midnight`.
- Theme tokens: prefer `tokens.css`, `theme.css`, and Tailwind token utilities from React Platform.

Do not port local `@font-face` blocks or local font files. They exist only so this repo can visually match the monolith outside the monolith.

The custom face-cluster geometry is allowed to stay custom. The design system currently gives visual primitives and tokens; it does not own this Team DNA-specific interaction pattern.

## Icon and avatar seam

The standalone `BetterUpIcon` bridge exists only to keep call sites shaped like the monolith.

Port target:

```tsx
import { Icon } from '@betterup/icons/src/Icon';

<Icon name="Edit" />
```

Delete `src/team-dna/components/BetterUpIcon.jsx` during the monolith port.

For avatars, prefer the existing BetterUp avatar/profile primitive if it can support the visual requirements. The current monolith reference includes `WBAvatar` in `ux/packages/core-react/src/components/WBAvatar/WBAvatar.tsx`.

If `WBAvatar` cannot support Team DNA's exact circular crop, selected ring, blocked state, and motion layering, keep a Team DNA-specific visual wrapper but feed it monolith avatar URLs/profile data. Do not keep fixture image paths in production.

## Motion and custom interaction seam

React Platform already has `motion` installed. Keep imports as:

```tsx
import { AnimatePresence, motion } from 'motion/react';
```

Do not add `framer-motion`.

Custom interaction code that should remain local to Team DNA:

- Face cluster selection and dimming.
- Selected ring geometry.
- Duo connection line.
- Measured nudges for close selected pairs.
- Larger invisible hitboxes around faces.
- Blocked selection feedback for teammates without completed assessments.
- Internal insight panel transitions.

Why this is okay: these are not generic design-system primitives. They are the product interaction for Team DNA.

Integration caution: `DuoConnection` and duo nudges measure live DOM positions using refs, `ResizeObserver`, `requestAnimationFrame`, and `getBoundingClientRect`. They should survive layout changes because they do not hardcode row/column positions, but they must be re-tested after any shell, CSS, or mobile layout changes.

Respect reduced-motion rules from the monolith. The standalone CSS already includes a broad `prefers-reduced-motion` fallback; adapt it to the monolith's existing motion-accessibility pattern if one exists.

## AI and insight seam

Do not add live frontend AI to Team DNA during the initial port.

Current prototype reality:

- Some copy is AI-assisted during authoring.
- Runtime insight rendering is deterministic fixture/content logic.
- `teamDnaPairInsights.js` can generate plausible fallback person/duo copy from Big Five scores.

Monolith target:

- Prefer backend-owned generated fields/statuses, similar to Team Pulse patterns.
- Frontend renders insight data; it should not choose models, hold protected prompts, or call an LLM directly.
- For future open-ended questions, reuse or deep-link into Lighthouse/Grow Chat rather than inventing a second chat engine.
- The main Team DNA surface must remain useful without chat.

## Supporting cards seam

`insight.cards` is the extension point for right-panel blocks.

Integration rule:

- Keep cards data-driven.
- Let each card declare a `kind` and `data` payload when content becomes real.
- Use `showLabel: false` when a card's visualization is self-evident and the visible mono heading adds noise; keep `label` anyway for accessibility and debugging.
- Use `kind: 'guidance'` for prose guidance regardless of whether the words came from deterministic fallback, authored copy, or AI synthesis. AI is a data source, not a separate UI card type.
- Add card renderers behind `InfoBlock` or a small `InsightCardRenderer`.
- Do not make cards import fixture data directly.

This is where future Bloom, Big Five/Big Why spectrum, team aggregate, or pair comparison cards should plug in.

## Suggested monolith port order

1. Add or identify the Team DNA route/subtab in React Platform.
2. Create a thin monolith `TeamDnaPage` that owns `BrowserTitle`, analytics, loading/error states, API query, and adapter mapping.
3. Copy `TeamDnaExperience`, feature components, hooks, and deterministic data helpers.
4. Delete/avoid all `dev/*`, local font assets, local monolith shell preview, and fixture avatar paths.
5. Replace `BetterUpIcon` with `@betterup/icons/src/Icon`.
6. Replace avatar fixture data with real profile/avatar fields or a monolith avatar primitive.
7. Move CSS into the monolith styling pattern and map local variables to component-library tokens/Tailwind utilities.
8. Wire add/remove/rename to real mutations, or remove those handlers if editing is out of scope.
9. Verify the feature inside the real Team shell, not only in isolation.

## Verification checklist

Before calling the port done:

- Team DNA appears inside the real Team shell and does not duplicate nav, tabs, or a fake monolith wrapper.
- No `MonolithTeamShell`, `TeamDnaDevPanel`, `teamDnaDevState`, copied font files, or copied fixture avatars ship in production.
- Route/page layer owns API, loading, errors, analytics, and title.
- Components receive normalized view-model props, not backend response shapes.
- Team, person, duo, incomplete-assessment, no-avatar, empty-team, and large-team states all render.
- The right panel scrolls internally with fade behavior inside the real tab-panel height.
- Duo line and nudges still align after the monolith layout is applied.
- Motion imports come from `motion/react`.
- Icons come from `@betterup/icons`.
- Typography uses monolith font/token paths, especially `font-display`/`--heading-display-font` for Ivar Display.

## One-shot prompt for a future AI assistant

Use this when asking an AI assistant to do the monolith port:

```txt
Port the standalone Team DNA feature from /Users/preetoshi/Documents/team-dna into the BetterUp monolith React Platform. Read reference documents/porting-to-monolith-guide.md first. Treat TeamDnaExperience as the feature panel to port, not TeamDnaPage as the final route. Use the real monolith Team shell, route gates, PageTabs or route-driven subtabs, generated API hooks, component-library tokens, @betterup/icons, WBAvatar/profile data if suitable, and motion/react. Do not port dev/*, MonolithTeamShell, TeamDnaDevPanel, local font assets, copied shell logo, or fixture avatars. Keep the adapter as the API seam and keep feature components API-blind. Preserve the team/person/duo selection contract and retest duo measured geometry inside the real route container.
```
