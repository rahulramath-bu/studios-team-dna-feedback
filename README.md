# Team DNA Prototype Hub

[Live demo](https://team-dna-two.vercel.app)

This repo is a portable Team DNA prototype, not a production-ready monolith
patch. It now contains the assessment experience, the Team DNA team page, and a
presenter flow that stitches them together for walkthroughs.

The useful part is the product and code shape. The unsafe part is assuming it
can be copied straight into BetterUp Monolith. It cannot. The real work is
stitching the assessment engine, Team DNA data model, AI generation, profile
photo, team permissions, routing, analytics, loading/error states, and design
system seams into the monolith.

The assessment UI is intentionally bespoke. It should feel more interactive
than a normal design-system form, but it should still use BetterUp tokens,
fonts, focus states, accessibility rules, and production data contracts.

## Current Routes

| Route | Surface | What it is now | Porting truth |
| --- | --- | --- | --- |
| `/` | Hub | Tiny chooser plus demo/engineering notes. | Do not port. |
| `/assessment` | Surface 1, "The DNA Finder" | Working local assessment prototype. | Port the data contract and interaction intent, not the local storage/scoring shell. |
| `/team-dna` | Surface 2, Team Page | Working Team DNA results and team management prototype. | `TeamDnaExperience` is the main portable frontend slice. |
| `/flow-demo` | Presenter flow | Iframed walkthrough of user and manager journeys. | Do not port. Useful for demos only. |

Older aliases like `/results`, `/surface-1`, and `/surface-2` are gone.

## What Changed Since The Old README

The root README used to say Surface 1 was a lightweight placeholder. That is no
longer true.

Surface 1 now includes:

- a welcome/start state
- Big Five Likert questions
- working-style spectrum questions
- non-scored interstitial moments
- non-scored image-choice breaks
- sound effects and motion
- camera/avatar capture
- deterministic local profile generation
- profile review/editing
- privacy toggles for team profile and pair comparison visibility
- debug payload copy/reset behind the backslash key
- localStorage draft persistence
- direct handoff into `/team-dna`

It is still prototype code. There is no authenticated persistence, no real
assessment configuration, no real AssessmentItem records, no real avatar upload,
no server-side Team DNA profile generation, no production privacy enforcement,
and no backend Team DNA result API.

## Repo Shape

| Path | Current role | Porting note |
| --- | --- | --- |
| `src/App.jsx` | Browser route switcher and hub. | Do not port. The monolith owns routing. |
| `src/main.jsx` | Vite app entrypoint. | Do not port. |
| `src/app-shell/appHub.css` | Local hub styling and engineering note modal. | Do not port. |
| `src/team-dna-assessment/*` | Surface 1 assessment prototype. | Port carefully against the monolith assessment and profile seams. |
| `src/team-dna/*` | Surface 2 Team DNA result experience. | Main source for reusable Team DNA UI and data shape. |
| `src/demo-flow/*` | Presenter-only iframe walkthrough. | Do not port. |
| `src/styles.css` | Standalone global CSS, local token fallbacks, fake monolith shell, Team DNA CSS. | Keep only Team DNA rules after mapping tokens. |
| `public/team-dna/avatars/*` | Demo people and directory avatars. | Do not ship as product data. |
| `public/frontend/assets/fonts/*` | Local font mirrors. | Do not port. Monolith already owns fonts. |
| `public/sounds/*` | Prototype interaction sounds. | Product/design should decide whether these survive. |
| `public/preetoshi.webm` | Engineering note video used by the hub overlay. | Do not port. The hub currently references this asset, but it is not part of Team DNA product code. |
| `SURFACE_1_AGENT_HANDOFF.md` | Older temporary handoff. | Useful history, not the current source of truth. |
| `SURFACE_1_VISION_IMPLEMENTATION_SPEC.md` | Older planning/spec artifact. | Useful history, not the current source of truth. |

There is also a deep Surface 2 handoff at `src/team-dna/README.md`. The root
README is now the current map. The nested README is still useful for Team Page
details, but cross-check it with code before treating any line as final.

## Surface 1: Assessment

Main files:

- `src/team-dna-assessment/TeamDnaAssessmentPage.jsx`
- `src/team-dna-assessment/teamDnaAssessmentModel.js`
- `src/team-dna-assessment/teamDnaAssessment.css`
- `src/team-dna-assessment/HalftoneHand.jsx`

The assessment currently builds its local step list from:

- 20 Big Five items in `BIG_FIVE_ITEMS`
- 7 working-style spectrum items in `WORKING_STYLE_ITEMS`
- 5 non-scored breaks in `EXPERIENCE_BREAKS`

The model scores Big Five locally by averaging 1-5 answers, reversing marked
items, and converting to a 0-100 scale. Working-style answers are stored as
0-100-ish slider values. `generateTeamDnaProfile` then picks the two strongest
trait signals and writes deterministic prototype copy.

That local generator is not AI. It is also not monolith scoring. Treat it as a
demo of what a Team DNA profile record might need after the real assessment
and generation services exist.

### Assessment Engine Fit

The monolith assessment engine already has the important lifecycle shape:

- `RouteAssessmentDetails.tsx` fetches an assessment, renders
  `AssessmentContainer`, updates draft responses, and submits final responses.
- `useUpdateAssessment` sends `assessment: { id, responses }`.
- `useSubmitAssessment` sends `assessment: { id, responses, submitted: true }`.
- `AssessmentContainer` reads
  `assessment.assessment_configuration.assessment_items` and stores responses
  by each `AssessmentItem.key`.
- `ConstructScoring` scores panel-built assessments after first submission when
  `submitted_at` becomes present.

The prototype mirrors that response shape with
`serializeAssessmentEnginePayload(responses)`, but it does not use real
AssessmentItem keys yet. The comment in `teamDnaAssessmentModel.js` is right:
the `tdna_*` keys intentionally look like AssessmentItem keys, but production
must replace them with the real assessment definition keys.

### Bespoke UI Boundary

The assessment UI is meant to be different from the default monolith assessment
form. The goal is a livelier, more engaging experience. That means engineering
has at least two possible paths:

1. Build a Team DNA-specific assessment route that still writes to the normal
   assessment response contract.
2. Extend the assessment package with Team DNA-specific widgets/layout hooks,
   if the platform team wants those widgets to live there.

Do not assume `AssessmentContainer` can simply render this exact experience
today. It supports standard item widgets like scale, continuum scale, radio,
textarea, interstitial, and multi-scale pages. It does not currently own this
prototype's fan-card Likert treatment, image breaks, halftone hand, camera
capture, self-review reveal, or profile privacy controls.

### Assessment Data That Is Not In The Engine Yet

The prototype currently keeps these together in localStorage:

- raw responses
- avatar data URL
- generated profile copy
- privacy choices

In production those probably split apart:

- assessment responses: normal assessment engine
- Big Five/working-style scores: assessment scoring or Team DNA result service
- avatar: existing profile/avatar upload pipeline
- generated profile copy: Team DNA generation/read-model service
- privacy choices: Team DNA profile settings or visibility policy

Submitted assessments should not be treated as an editable profile document.
Profile copy and privacy settings need their own post-assessment home.

## Surface 2: Team Page

Main files:

- `src/team-dna/TeamDnaExperience.jsx`
- `src/team-dna/TeamDnaPage.jsx`
- `src/team-dna/data/teamDnaViewModel.d.ts`
- `src/team-dna/data/teamDnaAdapter.js`
- `src/team-dna/data/teamManagementMock.js`
- `src/team-dna/components/*`
- `src/team-dna/dev/*`

`TeamDnaExperience` is the main portable component. It renders the two-pane
Team DNA surface: people on the left, insight read on the right, and the ask-AI
dock at the bottom.

`TeamDnaPage` is a standalone harness. It owns mock organization employees,
mock team records, mock Team DNA results, debug state, sample-team insertion,
demo query params, and fake lifecycle mutations. Do not port it as the final
route.

### The Important Data Contract

Components should consume `TeamDnaDataset` and `TeamDnaInsight`, not raw backend
objects. The type-only contract lives in:

```txt
src/team-dna/data/teamDnaViewModel.d.ts
```

Current dataset layers:

| Layer | Prototype file | Production replacement |
| --- | --- | --- |
| Organization identity | `mockOrganizationEmployees` | Organization employee/user directory data. |
| Team roster | `mockTeamRecords` | Real team or TeamMembership API. This is not defined in the prototype. |
| Team DNA results | `mockTeamDnaResultsByEmployeeId` | Team DNA assessment/result API. |
| Generated insight copy | `teamDnaGeneratedInsights.mock.js` | Backend-generated Team DNA insight records. |
| Deterministic fallback | `teamDnaPairInsights.js`, `teamDnaWatchOuts.js`, `teamDnaMeetingBehavior.js`, `teamDnaFallbackRoles.js` | Keep as fallback or replace with product-approved deterministic copy. |

The mapper in `teamManagementMock.js` is the key idea: keep generic employees,
generic team membership, and Team DNA results separate until the adapter creates
the Team DNA view model.

## Team Management

Current behavior:

- empty state when no team is selected or the selected team maps to zero members
- "Try with sample data" inserts `sampleTeamRecord` through the same path as a
  normal team record
- add/edit team overlay
- organization employee search
- manual email invites
- pending assessment treatment for incomplete employees/invites
- fake reminder mutation with row-level pending/sent state
- notify-new-teammates intent checkbox
- manager/admin debug toggle

Production truth:

- `TeamManagementOverlay` is a prototype shell.
- The monolith has `Sheet` / `SheetContent side="right"` in the component
  library. Use that shell instead of the hand-rolled overlay.
- The monolith has organization employee data patterns, including the partner
  employee list endpoint shape (`/organizations/:organizationId/employees`),
  but this prototype has not identified a final Team DNA team roster API.
- Reminder actions, invite rules, resend throttling, analytics, and user
  feedback are not implemented for real here.

## AI And Generation

There is no live AI in this repo.

What exists:

- handcrafted mock generated records in `teamDnaGeneratedInsights.mock.js`
- deterministic fallback generation in `teamDnaPairInsights.js`
- mock lifecycle resolution in `teamDnaGenerationLifecycle.mock.js`
- debug lifecycle states: `not_ready`, `pending`, `ready`, `failed`, `stale`

The useful product rule is:

```txt
real source data creates the team/person/duo target
AI enriches that target with nicer copy
fallback copy remains available when AI is missing, late, failed, or stale
```

Do not make the frontend choose models or call an LLM directly for the core
Team DNA result. Put protected prompts, model choice, retries, status, and
telemetry behind a backend service.

## Grow Chat Seam

The bottom ask box is local. It does not call Lighthouse.

What it does now:

- `TeamDnaChatInputBridge` renders a Team DNA-flavored input.
- `TeamDnaExperience` builds a payload with `initial_user_message`,
  `custom_instructions`, `title`, `behavior`, and `skip_initial_messages`.
- `TeamDnaPage` dispatches a local `team-dna:grow-chat-prompt` browser event.

What the monolith already supports:

- `ChatInputSection` wraps the Lighthouse `InputBox`.
- `ChatRouter` accepts `initial_user_message`, `custom_instructions`, `title`,
  `behavior`, and `skip_initial_messages`.
- `ChatRouter` stores `initial_user_message` in `LH.initial-user-message` and
  creates the conversation.
- `useGrowLogic` and the existing chat flow send the message once the
  conversation is ready.

First production path should likely deep-link to `lighthouse.chat` with Team DNA
context in `custom_instructions`. Do not build a Team DNA-only AI endpoint
unless product explicitly wants a separate embedded AI surface.

## BetterUp Monolith Cross-Check

Checked against local reference repo:

```txt
/Users/preetoshi/Documents/BetterUp Monolith
```

Important current facts:

- Team Tooling lives in `ux/apps/react-platform/src/member/team-tooling`.
- `TeamToolingRouter.tsx` currently routes Team Pulse, Workshops for Teams, and
  Team Tooling home. There is no Team DNA route there yet.
- `TeamToolingHome.tsx` already has a Team DNA card, but it is disabled and
  marked coming soon.
- The route constants in `ux/packages/core-react/src/routes.ts` do not define a
  Team DNA route yet. A likely future route would be under
  `/member/team-tooling/team-dna`, but that is not current monolith code.
- Team Tooling is wrapped by `TeamToolingGate`, which checks the Team Tooling
  user experience visibility and legacy access.
- The modern shell uses `MemberNavbar`; the fake monolith shell in this repo is
  only a visual preview.
- The design system is mixed. Modern React uses `@betterup/component-library`,
  token CSS, Tailwind token mapping, and `@betterup/icons`. Legacy CSS and
  Ember/Rails surfaces still exist. Do not write the README as if the monolith
  is one clean design-system-only world.

Useful monolith files:

| Concern | Monolith path |
| --- | --- |
| Team Tooling router | `ux/apps/react-platform/src/member/team-tooling/routers/TeamToolingRouter.tsx` |
| Team Tooling home / current Team DNA card | `ux/apps/react-platform/src/member/team-tooling/pages/TeamToolingHome.tsx` |
| Route constants | `ux/packages/core-react/src/routes.ts` |
| App router | `ux/apps/react-platform/src/router.tsx` |
| Team Tooling gate | `ux/apps/react-platform/src/member/team-tooling/components/TeamToolingGate.tsx` |
| Assessment route | `ux/apps/react-platform/src/assessments/routes/RouteAssessmentDetails.tsx` |
| Assessment hooks | `ux/packages/assessments/src/hooks/assessments.ts` |
| Assessment container | `ux/packages/assessments/src/components/AssessmentContainer.tsx` |
| Assessment item renderer | `ux/packages/assessments/src/components/AssessmentItem.tsx` |
| Assessment types | `ux/packages/assessments/src/types/assessment.ts` |
| Construct scoring | `packs/assessments/engine/app/models/concerns/construct_scoring.rb` |
| Assessment engine docs | `packs/assessments/engine/README.md` |
| Chat input wrapper | `ux/apps/react-platform/src/member/components/MemberHome/components/shared/ChatInputSection.tsx` |
| Chat router | `ux/apps/react-platform/src/lighthouse/standalone/routes/ChatRouter.tsx` |
| Lighthouse input | `ux/apps/react-platform/src/lighthouse/standalone/components/MainArea/InputBox/InputBox.tsx` |
| Component library Sheet | `ux/packages/component-library/src/components/ui/sheet.tsx` |
| Component library Button | `ux/packages/component-library/src/components/ui/button.tsx` |
| Component library Textarea | `ux/packages/component-library/src/components/ui/textarea.tsx` |
| Icons | `@betterup/icons/src/Icon` |
| Avatar precedent | `ux/packages/core-react/src/components/WBAvatar/WBAvatar.tsx` |
| Token docs | `ux/packages/component-library/tokens/README.md` |
| React Platform global token imports | `ux/apps/react-platform/src/styles/index.css` |
| Tailwind token mapping | `ux/apps/react-platform/tailwind.config.js` |

## Design System And Styling

The prototype mirrors BetterUp-ish tokens at the top of `src/styles.css` and
`src/team-dna-assessment/teamDnaAssessment.css`. That is for local Vite only.

Production direction:

- inherit monolith `tokens.css` and `theme.css`
- use Tailwind token utilities where possible
- use component-library `Button`, `Textarea`, and `Sheet` for normal controls
- replace `BetterUpIcon.jsx` with `@betterup/icons`
- use the real avatar/profile primitive if it can support Team DNA's visual
  needs
- keep custom Team DNA visuals custom when they are product-specific

Custom pieces that do not need to become generic design-system primitives right
now:

- face cluster layout
- duo line geometry
- Big Five bloom
- archetype image cards
- assessment fan-card interaction
- halftone/hand transition
- self-review reveal choreography

Those pieces should still use tokens, semantic HTML, keyboard/focus behavior,
and reduced-motion handling.

Do not port:

- local `@font-face` blocks
- fake monolith shell CSS
- hub CSS
- demo-only wireframe CSS
- fixture avatars as product data
- local debug panel styling

## Full Component And Design Audit

This section is intentionally detailed. It is here so an engineer, Claude,
Codex, or another agent can see every meaningful surface before touching the
monolith.

### App Shell And Demo Surfaces

| File/component | What it owns now | Design/port call |
| --- | --- | --- |
| `src/App.jsx` / `useRoute` | Tiny local history router for `/`, `/assessment`, `/team-dna`, and `/flow-demo`. | Do not port. React Platform and core route constants own production routing. |
| `PrototypeHub` | Surface chooser, demo intro, engineer intro, and GitHub README link. | Do not port. It is a packaging wrapper for this repo. |
| `SurfaceLink` / `SurfaceIcon` | Hub cards and hand-drawn local SVG icons. | Do not port. Use monolith nav/entry cards if a launcher is needed. |
| Engineer intro video | Uses `/preetoshi.webm` inside the hub overlay. | Do not port. Treat as handoff context only. |
| `src/app-shell/appHub.css` | Hub layout, dark overlay, video modal, wireframe toggle styling. | Do not port. |
| `src/demo-flow/DemoFlowPage.jsx` | Presenter shell that iframes real prototype routes and advances scripted moments. | Do not port. Useful only for walkthroughs. |
| `demoFlowMoments.js` | User/manager presenter script. | Do not port as product state. It can inform QA scripts or demo docs. |
| `demoOnlyWireframeMode.css` | Query-param wireframe mode for demos. | Do not port. Keep isolated from product styling. |

### Surface 1 Assessment Components

| Component/module | What it owns now | Design/port call |
| --- | --- | --- |
| `TeamDnaAssessmentPage` | Whole local assessment state machine: welcome, questions, avatar, processing, review. | Port the product flow and response contract, not the local state/persistence shell. |
| `teamDnaAssessmentModel.js` | Local item list, local scoring, deterministic profile generation, `serializeAssessmentEnginePayload`. | Replace item IDs with real `AssessmentItem.key` values. Replace scoring/generation with production assessment/generation ownership. Keep serialization idea. |
| `WelcomeStep` | Bespoke opening with halftone hand, grid lines, Big Five citation, start CTA. | Bespoke is intentional. Rebuild with real tokens and production asset rules. |
| `HalftoneHand` | Three.js/R3F hand visual using `/models/female_hand.glb`. | Product/design must decide if this ships. If yes, treat as an approved asset with loading, fallback, and reduced-motion behavior. |
| `AssessmentProgress` | Fixed top progress bar with optimistic motion. | Can stay Team DNA-specific, but should use monolith color tokens and route-safe fixed positioning. |
| `QuestionStep` | Routes Big Five, working-style, interstitial, and image-choice steps. | Keep the flow logic, but wire answers into the real assessment update/submit path. |
| `LikertControl` / `LikertOption` | Fan-card Big Five answer treatment with auto-advance. | This is not a current monolith widget. Either build Team DNA-specific widgets or extend the assessment package deliberately. |
| `WorkingStyleControl` | Bespoke range slider with two poles and continue button. | Could map partly to component-library `Slider`, but the current visual treatment is custom. |
| `InterstitialBreak` | Non-scored animated text break based on previous Big Five response. | Not a standard monolith interstitial. It is product-specific pacing. |
| `ImageChoiceBreak` / `ImageChoiceOption` | Non-scored image-choice breaks using Wikimedia redirect URLs. | Do not rely on external Wikimedia URLs in production. Move to approved assets/CDN or replace. |
| `AvatarStep` | Camera permission, countdown, snapshot canvas, upload fallback, redo, skip. | Replace data URL storage with the existing profile/avatar upload pipeline and privacy review. Needs permission/error QA. |
| `ProfileLoader` / `ProfileLoaderVisual` | Local "AI profile generating" loader; no real AI. | Replace timing with real generation status or server job state. Keep only if design approves the animation. |
| `ReviewStep` | Self-review reveal, editable profile copy through `InsightPanel`, photo edit, privacy toggles, save to `/team-dna`. | This is important product behavior. Production needs real profile-copy storage and visibility enforcement. |
| `Toggle` | Local pill toggles for profile visibility and pair visibility. | Replace with monolith switch/toggle primitive if available, or build one under component-library conventions. |
| `DebugPanel` | Copy/reset local JSON payload behind backslash. | Do not port to users. A gated developer/admin tool may be useful separately. |
| `teamDnaAssessment.css` | Full-screen bespoke assessment CSS. | Keep only Team DNA-specific rules after token mapping. Watch fixed positioning, overflow hidden, viewport height, mobile layout, and reduced-motion gaps. |
| `public/sounds/*` | Click/select/option/loader sounds. | Product/design/accessibility decision needed. Do not ship by default. |

The assessment is deliberately more playful than the standard assessment
package. That is okay. The honest monolith statement is: the assessment package
has useful lifecycle and response plumbing, but it does not currently render
this exact experience.

### Surface 2 Layout And Selection Components

| Component | What it owns now | Design/port call |
| --- | --- | --- |
| `TeamDnaExperience` | Main portable Team DNA surface: selection state, view permissions, people pane, insight pane, chat dock. | This is the primary frontend component to adapt into the monolith route. |
| `TeamDnaPage` | Local harness: mock team records, demo params, fake mutations, fake Grow Chat event, dev panel. | Do not port as the production route. Recreate a route/page using monolith hooks, BrowserTitle, analytics, permissions, and API data. |
| `TeamContextSwitcher` | Fixed/portal team selector plus edit/add entry points. | Replace data with a real team context source. Check whether production wants this custom control or a monolith menu/select primitive. |
| `TeamFaceField` | Team/person/duo heading, face grid, selection behavior, hover preview line, duo selected line, tap hints, measured nudges. | Keep Team DNA-owned. This is product-specific interaction code, not a generic design-system component. Retest after shell/layout changes. |
| `TeamFace` | One semantic face button with avatar/name fallback, selected ring, pending pill, hover tooltip, pulse, blocked shake, press feedback. | Keep the motion layers local. Feed real avatar/profile data. Consider `WBAvatar` only if it can fit inside these visual layers. |
| `DuoConnection` | SVG line measured from actual face DOM positions. | Keep local. It depends on real layout measurements and must be retested for responsive layouts. |
| `useTeamDnaPressable` | Press state plus optional short haptic vibration. | Keep local unless BetterUp already has a Pressable primitive that covers it. Haptics need product/accessibility review. |
| `TeamDnaEmptyPreview` | Animated empty-state preview using local sample faces/cursor. | Optional. Do not ship fixture people. Use approved sample-safe content if production keeps an animated preview. |

### Surface 2 Insight Components

| Component | What it owns now | Design/port call |
| --- | --- | --- |
| `InsightPanel` | Right-side insight read, selected-read fade, lifecycle banner/waiting state, self-review mode, own-profile inline editing. | Portable, but swap local textareas/buttons for component-library primitives and wire lifecycle actions to real mutations. |
| `InfoBlock` | Card renderer switch by `card.kind`; shared supporting-card frame and edit action. | Keep the `card.kind` extension point. Replace `BetterUpIcon` and review card styling against monolith tokens. |
| `ArchetypeImageCard` | Solo image, duo crossfade, team stacked imagery. | Keep if generated/approved art exists. Do not treat current jpgs as final product assets. |
| `BigFiveBloom` | SVG radial Big Five shape for person, duo, or team average/overlap. | Keep custom. It is a product visualization, not a generic chart. Validate color contrast and screen-reader text. |
| `BigFiveSpectrumList` | Trait carousel, show-all mode, team distribution band, subject markers, reduced-motion handling. | Keep custom. Replace hardcoded color list with approved data-viz tokens where possible. |
| `GuidanceCard` | One or many guidance sections; multi-section horizontal marquee. | Keep data shape. Recheck marquee behavior for reduced motion and keyboard/focus expectations. |
| `WatchOutCard` | Watch-out and meeting-behavior copy renderer. | Keep simple. It is intentionally just copy, not a warning-heavy visual. |
| `TeamShapeContributions` | Team role distribution tags with tiny face stacks and tooltip. | Keep if the role-distribution concept ships. Replace tooltip/avatar shell if monolith has a better primitive. |
| Inline editors in `InsightPanel` | Local textareas and local buttons for editing own profile copy. | Replace with component-library `Textarea` and `Button`. Wire to real profile-copy mutation and optimistic/error states. |

### Team Management Components

| Component/module | What it owns now | Design/port call |
| --- | --- | --- |
| `TeamManagementOverlay` | Hand-rolled right-side add/edit team panel, selected members, employee search, manual invites, reminders, notify toggle. | Replace shell with component-library `Sheet` / `SheetContent side="right"`. Keep roster-first interaction if product likes it. |
| Employee search inside overlay | Filters local normalized employees by name/email/title; allows manual email invite. | Replace with real organization employee query and approved invite rules. Add loading, empty, error, pagination, throttling as needed. |
| Reminder buttons | Fake row-level pending/sent state. | Replace with real reminder mutation, rate limits, toasts, and analytics. |
| `teamManagementMock.js` | Separates organization employee identity, team records, and Team DNA result data before mapping to `TeamDnaDataset`. | This separation is important. Keep the adapter idea; replace fixtures with generated API data. |
| Empty state in `TeamDnaPage` | Create/add team, try sample data, animated preview. | Production needs a real first-run/teamless state and permission-specific copy. Do not ship sample insertion as normal product behavior. |

### Data, AI, And Lifecycle Modules

| Module | What it owns now | Design/port call |
| --- | --- | --- |
| `teamDnaViewModel.d.ts` | Normalized frontend contract for team, member, insight, cards, lifecycle. | Promote to real TypeScript near the monolith adapter. Components should stay API-blind. |
| `teamDnaAdapter.js` | Selection resolver and card composition from `TeamDnaDataset`. | Keep as the mental model. Replace fixture imports with API hooks/mappers. |
| `teamDnaIds.js` | Stable order-insensitive pair IDs. | Keep behavior even if backend later provides IDs. Pair lookup should not depend on click order. |
| `teamDnaGenerationLifecycle.mock.js` | Mock target/status logic and team minimum of 3 completed assessments. | Replace with backend status fields. Keep visible states: `not_ready`, `pending`, `ready`, `failed`, `stale`. |
| `teamDnaGeneratedInsights.mock.js` | Mock backend-generated insight records. | Do not port as frontend AI logic. It is example output shape. |
| `teamDnaPairInsights.js` | Deterministic fallback team/person/duo copy. | Keep only if product wants fallback copy when AI is missing/failed/stale. |
| `teamDnaFallbackRoles.js` | Deterministic role titles from strongest trait poles. | Product/content review needed before shipping. |
| `teamDnaWatchOuts.js` / `teamDnaMeetingBehavior.js` | Deterministic supporting copy. | Same: useful fallback, not final generated intelligence. |
| `teamDnaArchetypeImages.js` / prompts / assets | Maps role signals to local archetype images. | Treat as placeholder art/prompt scaffolding until production asset and generation strategy is approved. |
| `bigFiveTraits.js` | Trait order, labels, low/high poles, fallback copy. | Keep as frontend display metadata after assessment/scoring owns raw scores. |
| `SCOTT_PREETOSHI_ALIGNMENT_DECISIONS.md` | Product/content decision history. | Useful context, but root README and code are the current port map. |

### CSS And Asset Risks

The prototype CSS is large: `src/styles.css` owns global tokens, fake monolith
chrome, Team DNA layout, dev panel styling, visualizations, and responsive
rules. `teamDnaAssessment.css` owns a separate full-screen assessment world.
That is fine for Vite. It is risky as a monolith patch.

Specific risks to clean up during port:

- global `html`, `body`, `button`, and `:root` ownership
- local `@font-face` mirrors
- fixed and portal layers: team switcher, chat dock, tooltips, debug panels,
  assessment back/progress controls, review dock, team management sheet
- `z-index` values that assume this standalone app owns the whole page
- `overflow: hidden` on the assessment page
- viewport-height layouts that need mobile browser testing
- `:has()` selectors in spectrum styling
- `color-mix()` token fallback behavior
- `backdrop-filter` in hub/dev/chat/review styling
- local cursor, sound, hand model, fixture avatars, archetype jpgs, and
  external image-choice URLs
- motion-heavy interactions that need `prefers-reduced-motion` checks beyond
  the places already covered

### Monolith Pattern Match

Here is the clearest current mapping from prototype pieces to real monolith
surfaces:

| Prototype concern | Monolith counterpart checked | Current truth |
| --- | --- | --- |
| Product route | `TeamToolingRouter.tsx`, `TeamToolingHome.tsx`, core `routes.ts` | Team DNA is not routed yet. The Team Tooling home card exists but is disabled. |
| Product shell | `TeamToolingLayout` with `MemberNavbar`, `TeamToolingGate` | Use the real shell/gate. Delete fake shell preview. |
| Normal buttons/text/headings | component-library `Button`, `Text`, `Heading` | Replace local normal controls. Keep bespoke visualizations custom. |
| Right-side team management panel | component-library `Sheet` | Replace hand-rolled overlay shell with Radix Sheet wrapper. |
| Inline profile editing | component-library `Textarea` and `Button` | Replace local textareas/buttons. Add mutation/loading/error states. |
| Icons | `@betterup/icons/src/Icon` | Delete `BetterUpIcon.jsx` during monolith port. |
| Avatar | `WBAvatar` exists | Use if it can support the TeamFace visual stack; otherwise use real avatar URLs inside Team DNA's custom button. |
| Assessment response lifecycle | `RouteAssessmentDetails`, `AssessmentContainer`, assessment hooks | Reuse update/submit semantics. Bespoke Team DNA UI must still write real `responses`. |
| Assessment widgets | `ScaleWidget`, `SliderWidget`, `RadioWidget`, `InterstitialWidget`, `MultiScalePage` | Good plumbing, but not enough to render current fan-card/image/camera/review experience as-is. |
| Organization people | Partner employee list hook using `/organizations/:organizationId/employees` | Useful precedent for normalized employees; not the final Team DNA roster API. |
| Grow Chat | `ChatInputSection`, Lighthouse `InputBox`, `ChatRouter` | Existing chat can accept Team DNA context through search params. The prototype's browser event is local only. |
| AI lifecycle precedent | Team Pulse results/dashboard poll generation statuses | Useful pattern: server status, polling, retry. Team DNA still needs its own backend contract. |

### What Should Become Shared Versus Stay Bespoke

Likely shared or monolith-owned:

- route constants, route shell, BrowserTitle, analytics, loading/error pages
- Button/Textarea/Sheet/Icon/Text/Heading primitives
- employee search/query plumbing
- avatar upload/profile-photo storage
- assessment update/submit hooks
- generation status polling/retry/toast patterns

Likely Team DNA-owned:

- face cluster and selection behavior
- duo connection geometry
- Team DNA selection-to-insight resolver
- Big Five bloom
- Big Five spectrum visualization
- archetype/role imagery card
- Team DNA insight card composition
- assessment fan-card and review choreography, if product keeps this bespoke

Still undecided:

- whether the team switcher becomes a generic team-context control
- whether the team management inside-panel pattern becomes reusable
- whether assessment image-choice/interstitial widgets belong in the assessment
  package or only in Team DNA
- whether generated Team DNA profile editing becomes a generic AI-profile
  editing pattern
- whether the bottom Team DNA ask box is just a Grow Chat deep link or a true
  embedded contextual AI surface

## Presenter Flow

`/flow-demo` is a walkthrough shell. It reads `src/demo-flow/demoFlowMoments.js`
and iframes the real routes with query params.

Supported journeys:

- `/flow-demo?journey=user`
- `/flow-demo?journey=manager`
- optional `view=wireframe`

The wireframe mode is only for partner walkthroughs where visual detail gets in
the way. It is isolated in `src/demo-flow/demoOnlyWireframeMode.css` and should
not influence product styling.

## What To Port

Port or adapt:

- `src/team-dna/TeamDnaExperience.jsx`
- `src/team-dna/components/*`, with design-system primitive swaps
- `src/team-dna/hooks/*`
- `src/team-dna/data/teamDnaViewModel.d.ts`
- `src/team-dna/data/teamDnaAdapter.js` as the adapter pattern
- deterministic fallback helpers if product wants non-AI fallback
- the `teamManagementMock.js` mapper concept, not the mock records
- Surface 1 question sequence, data needs, and interaction intent
- the assessment response serialization idea
- the Grow Chat search-param handoff shape

Port carefully, after rewriting against monolith APIs:

- Team management add/edit behavior
- reminder actions
- profile copy editing
- privacy toggles
- assessment completion and generation lifecycle states
- avatar capture/upload
- local CSS variables

## What Not To Port

Do not port these as production code:

- Vite app shell
- root hub
- `/flow-demo`
- demo-only wireframe mode
- `src/team-dna/dev/*`
- fake monolith shell
- `TeamDnaPage` as the final route
- `TeamManagementOverlay` shell as-is
- `BetterUpIcon.jsx`
- fixture people, scores, avatars, and generated copy
- `teamDnaGeneratedInsights.mock.js` as frontend AI logic
- localStorage persistence
- local deterministic profile generation as the production profile generator
- local camera data URL storage
- prototype sound effects without product/design approval

## Open Product And Engineering Questions

These are still unresolved and should not be hidden:

- Where should the production Team DNA route live? The likely place is under
  Team Tooling, but the route does not exist today.
- What is the real team roster API? The prototype has only a minimal local
  `teamRecord` shape.
- Should the assessment be implemented as a custom route that writes standard
  responses, or as extensions to the shared assessment package?
- What exact constructs/items define the Team DNA assessment?
- Where do working-style spectrum answers live relative to Big Five scoring?
- How are open-ended work-context prompts added for AI synthesis?
- Where is profile photo capture/upload owned?
- Where are Team DNA privacy settings stored and enforced?
- What backend service owns Team DNA profile/person/duo/team generation?
- What is the minimum responsible threshold for showing team reads in product?
  The prototype uses 3 completed assessments for team summary readiness.
- Are duo reads precomputed for all completed teammates, generated on demand, or
  both?
- Who can create/edit Team DNA teams, send reminders, generate early, or refresh
  stale insights?
- How should generated copy be reviewed, edited, moderated, and versioned?
- Should the bottom AI ask box be a deep link to Grow Chat or an embedded
  contextual AI surface?

## Verification Checklist For A Real Port

Before anyone says the monolith port is done:

- Team DNA has a real route in React Platform and is reachable from Team
  Tooling or the chosen product home.
- The disabled coming-soon card is replaced or intentionally left with a clear
  launch plan.
- The assessment writes real `Assessment.responses` by real `AssessmentItem.key`
  values.
- Submitting the assessment follows normal `submitted: true` semantics.
- Avatar/profile/privacy data is not stuffed into submitted assessment
  responses unless product explicitly chooses that.
- Components receive normalized `TeamDnaDataset` / `TeamDnaInsight` objects.
- Organization employee data, team roster data, and Team DNA result data stay
  separate until the adapter layer.
- Team, person, duo, empty, waiting, pending, failed, stale, missing-avatar,
  private-profile, pair-not-allowed, and incomplete-assessment states render.
- Manager/admin controls are permission-gated.
- Viewer-owned profile editing is identity-gated, not manager-gated.
- Grow Chat handoff uses the existing Lighthouse route/search-param mechanism,
  or product has approved a different AI surface.
- Component-library primitives replace local form/sheet/icon primitives where
  they fit.
- Local fonts, fake shell, debug panel, fixture data, demo flow, and local
  storage do not ship.
- Tests cover route behavior, adapter mapping, selection rules, permission
  gates, assessment submit/update shape, generation lifecycle rendering, and the
  Grow Chat handoff.

## Local Development

```sh
npm install
npm run dev
```

Useful routes:

```txt
/
/assessment
/assessment?fresh=1
/assessment?demo=questions&q=0
/assessment?demo=avatar
/assessment?demo=review
/team-dna
/team-dna?demo=empty
/team-dna?demo=team
/team-dna?demo=person&members=preetoshi
/team-dna?demo=pair&members=preetoshi,jon
/flow-demo?journey=user
/flow-demo?journey=manager
/flow-demo?journey=manager&view=wireframe
```

Debug controls:

- Backslash toggles the Surface 1 debug payload panel.
- Backslash toggles the Surface 2 dev panel when not in demo query-param mode.
- The Surface 2 dev panel can change team size, monolith shell preview,
  manager/admin access, viewer identity, avatar availability, assessment
  completion, privacy, pair permission, and generation lifecycle state.

## One Sentence Summary

This repo is a high-fidelity, code-backed map for Team DNA. It shows what the
assessment and team page should feel like, and it gives engineers real seams to
port from, but every persistence, routing, permission, scoring, avatar, and AI
integration still needs real monolith ownership.
