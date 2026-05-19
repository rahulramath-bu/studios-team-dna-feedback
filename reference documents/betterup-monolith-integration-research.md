# BetterUp monolith integration research for Team DNA

Date: May 19, 2026  
Reference repo inspected: `/Users/preetoshi/Documents/BetterUp Monolith`  
Purpose: capture the codebase facts and integration advice that should guide the Team DNA launchpad prototype and a later monolith port.

## Quick read

Team DNA should be built as a modern React Platform feature inside the Team Tooling area, not as an Ember feature and not as a separate mini-app shell.

The most harmonious future route is likely:

```txt
/platform/member/team-tooling/team-dna
```

or, inside React Router's basename:

```txt
/member/team-tooling/team-dna
```

The product reality is that Team DNA may become a Team subtab next to Team Pulse, Overview, and similar pages. The code does not yet show a complete top-level Team subtab shell in Team Tooling, but it does show the right ingredients: `MemberNavbar`, route constants, route ownership, feature gates, generated API hooks, secondary nav examples, and component-library tabs.

For design-system alignment, the best path is the modern React component library plus tokens:

- `@betterup/component-library`
- `@betterup/icons`
- semantic token-backed Tailwind classes
- `motion/react` for animation

Avoid copying legacy styling just because it exists nearby. The monolith has several eras of UI code living together. Team DNA should use the future-facing path, not every pattern the repo contains.

For AI, do not invent a new chat engine for phase one. The best first pattern is the Team Pulse generated-insight model: backend-owned generated fields, generation status, polling, retry, and feedback. Lighthouse/Grow Chat should be reused later for open-ended Q&A or contextual chat, but the core Team DNA insight surface should be useful even before chat exists.

## Sources inspected

Local code:

- `ux/apps/react-platform/src/router.tsx`
- `ux/packages/core-react/src/routes.ts`
- `ux/packages/core-react/src/config/routeOwnership.ts`
- `ux/packages/core-react/src/components/PrimaryNavbar/config.ts`
- `ux/apps/react-platform/src/member/team-tooling/routers/TeamToolingRouter.tsx`
- `ux/apps/react-platform/src/member/team-tooling/pages/TeamToolingHome.tsx`
- `ux/apps/react-platform/src/member/team-tooling/pages/ManagerDashboard.tsx`
- `ux/apps/react-platform/src/shared/components/TeamHealthReportCard/TeamHealthReportCard.tsx`
- `ux/apps/react-platform/src/member/team-tooling/pages/SessionResults/ReviewResults.tsx`
- `ux/apps/react-platform/src/member/team-tooling/pages/SessionResults/FacilitateDiscussion.tsx`
- `ux/apps/react-platform/src/lighthouse/**`
- `ux/apps/ember-frontend/app/services/genai.js`
- `ux/apps/ember-frontend/app/pods/components/genai-experience/**`
- `ux/apps/ember-frontend/app/services/lighthouse.js`
- `ux/apps/ember-frontend/app/services/lighthouse-chat.js`
- `ux/packages/component-library/**`

Figma:

- BetterUp Design System file: `p4ZtQHYZSP4E6nzRF6oF6m`
- Deep-linked node: `248:4210`
- The available screenshot of that node shows form-field documentation: anatomy, field spacing, input/select/search variants, options, checkboxes, radios, and light/dark states.
- Figma library lookup confirmed the file is subscribed to the team library named `BetterUp Design System`.
- Figma metadata and variable extraction for the large node timed out or required an active selection, so the codebase token/component implementation is the stronger evidence for integration decisions.

## 1. Design-system reality

The monolith does not have one perfectly clean UI system. It has modern React component-library code, older `core-react` pieces, Ember/web-component surfaces, old Sass/Tailwind layers, and some hardcoded styling in product surfaces.

That means "matching the monolith" is not enough. The better goal is: match the monolith's most canonical modern path.

### Canonical path for new Team DNA work

Use the component library for normal UI primitives:

- `@betterup/component-library/src/components/ui/button`
- `@betterup/component-library/src/components/ui/heading`
- `@betterup/component-library/src/components/ui/text`
- `@betterup/component-library/src/components/ui/input`
- `@betterup/component-library/src/components/ui/textarea`
- `@betterup/component-library/src/components/ui/select`
- `@betterup/component-library/src/components/ui/label`
- `@betterup/component-library/src/components/ui/badge`
- `@betterup/component-library/src/components/ui/skeleton`
- `@betterup/component-library/src/components/ui/tabs`
- `@betterup/component-library/src/components/ui/page-tabs`

Use icons from:

```ts
@betterup/icons
```

Use animation from:

```ts
motion/react
```

The React Platform package already depends on `motion` version `^12.38.0`. There is no need to add `framer-motion` separately. For Team DNA, use `AnimatePresence` and `motion` from `motion/react`.

### Token path

The component library owns the current token files:

- `ux/packages/component-library/tokens/output/tokens.css`
- `ux/packages/component-library/tokens/output/theme.css`

React Platform imports these at the top of:

```txt
ux/apps/react-platform/src/styles/index.css
```

The component-library token README says the raw Figma export is reference material, but the maintained CSS token files are the practical source used by the app. It also recommends token use through Tailwind-style semantic classes.

Useful current theme values from the `2026` / `uplift` theme:

- `--page-background`: `#F3F2EE`
- `--background`: `#F3F2EE`
- `--foreground`: `#1D1925`
- `--foreground-heading`: `#1D1925`
- `--foreground-body`: `#5C5C5C`
- `--card`: `#FFFFFF`
- `--card-bg`: `#FFFFFF`
- `--card-shadow`: `0 5px 15px 0 rgba(29, 25, 37, 0.20)`
- `--primary`: `#CE0058`
- `--primary-hover`: `#E80063`
- `--primary-foreground`: `#FFFFFF`
- `--radius`: `0.75rem`

These map nicely to the Team DNA concept:

- Warm page surface: use `--page-background` first.
- Main text: use `--foreground` / `--foreground-heading`.
- Body copy: use `--foreground-body`.
- Selection ring: use `--primary`.
- Cards/info blocks: use `--card`, `--card-shadow`, border tokens, and radius tokens before inventing local values.

### What the design system does not own yet

The design system appears strong on visual primitives and component states. It does not appear to define a product-specific interaction pattern like an animated team face field.

That is good news. Team DNA can be design-system-aligned while still introducing a new interaction pattern.

The custom Team DNA pieces should be:

- `TeamFace`
- `TeamFaceField`
- `TeamDnaInsightHero`
- `TeamDnaInfoBlock`
- `TeamDnaSelectionModel`
- `TeamDnaDebugPanel`

Those pieces can be custom because the design system does not currently own their behavior. But their colors, text styles, buttons, focus states, and card surfaces should still come from the design system.

### What to avoid

Avoid these as the default path for Team DNA:

- Legacy `.wb-btn-*` classes.
- Old Ember-only patterns unless the feature is forced into Ember.
- Bootstrap/Sass-era styles.
- `@betterup/core-react` button-style primitives when the component-library version exists.
- Raw hex colors when a theme token can do the job.
- Hardcoded radii and shadows for ordinary cards/buttons.
- Duplicated visual components just to fake animation.

It is fine to use local CSS for the actual Team DNA face layout and motion geometry. That is product-specific interaction work, not generic design-system work.

### Build sequencing advice

Do not start the isolated prototype by forcing every visual decision through the design system. That risks flattening the idea before the interaction is clear.

Do start with monolith-compatible bones:

- React components.
- `motion/react`.
- semantic face buttons.
- stable member IDs.
- a thin page shell.
- a mock adapter shaped like a future API hook.

Then run a design-system pass before calling the prototype portable:

- Map colors, fonts, buttons, cards, focus states, and shadows back to component-library primitives and tokens.
- Keep local CSS for the Team DNA interaction itself: face cluster geometry, selected/dimmed behavior, duo focus, and animation.
- If a design-system primitive makes the experience worse, keep the custom treatment deliberately and document why.

This gives Team DNA the right posture: ideal user experience first, but without creating a throwaway island.

### Design-system argument to make to designers

Team DNA should say:

"We are not ignoring the design system. We are using its tokens and primitives for the visual language, then adding one product-specific interaction pattern on top because the system does not currently define interaction patterns at this level."

That is the cleanest bridge between design ambition and codebase reality.

## 2. User-facing information architecture

### App shell

React Platform runs under:

```ts
export const BASE_ROUTE = '/platform';
```

from:

```txt
ux/packages/core-react/src/routes.ts
```

The top-level React router mounts inside `BrowserRouter basename={BASE_ROUTE}` in:

```txt
ux/apps/react-platform/src/router.tsx
```

Authenticated member routes go through:

- `AuthenticatedRoutes`
- `OnboardingGate`
- nested route routers such as `InsightsRouter`, `PlansRouter`, `LighthouseRouter`, `TeamToolingRouter`, and `MemberRouter`

Team DNA should live in this React Platform route world.

### Team Tooling today

Team Tooling is mounted here:

```tsx
<Route
  path={`${routes.member.base}/team-tooling/*`}
  element={<TeamToolingRouter />}
/>
```

The route constants currently include:

```ts
member: {
  base: '/member',
  teamTooling: {
    base: 'team-tooling',
    home: '/member/team-tooling',
    workshopsForTeams: '/member/team-tooling/workshops-for-teams',
    teamPulse: {
      root: '/member/team-tooling/team-pulse',
      setup: '/member/team-tooling/team-pulse/setup',
      ftux: '/member/team-tooling/team-pulse/ftux',
      dashboard: '/member/team-tooling/team-pulse/dashboard',
    },
  },
}
```

`TeamToolingRouter` wraps its pages in:

```tsx
const TeamToolingLayout = () => (
  <div className="flex flex-col h-screen">
    <MemberNavbar />
    <Outlet />
  </div>
);
```

It also gates access through `TeamToolingGate`, which checks the `team_tooling` visible experience plus a legacy `has_team_tooling` user flag.

Current Team Tooling routes:

- `/member/team-tooling`
- `/member/team-tooling/team-pulse`
- `/member/team-tooling/team-pulse/setup`
- `/member/team-tooling/team-pulse/ftux`
- `/member/team-tooling/team-pulse/:sessionId/live`
- `/member/team-tooling/team-pulse/:sessionId/results/review`
- `/member/team-tooling/team-pulse/:sessionId/results/facilitate`
- `/member/team-tooling/team-pulse/:sessionId/past-results`
- `/member/team-tooling/team-pulse/dashboard`
- `/member/team-tooling/workshops-for-teams`
- `/member/team-tooling/workshops-for-teams/:seriesId/request`
- `/member/team-tooling/workshops-for-teams/:seriesId/requested`

`TeamToolingHome` already includes a disabled Team DNA card. This is a strong breadcrumb that Team DNA belongs inside the Team Tooling area.

### Global Team nav

The global member nav is built in:

```txt
ux/packages/core-react/src/components/PrimaryNavbar/config.ts
```

It shows the Team link when:

```ts
visibleExperiences.includes('team_tooling')
```

The Team link points to:

```txt
/platform/member/team-tooling
```

Route ownership also confirms the area:

```txt
/member/team-tooling -> squad-manage-ecosystem / team_tooling
```

from:

```txt
ux/packages/core-react/src/config/routeOwnership.ts
```

### Subtabs and page-level navigation

Team Tooling itself does not yet show a clear shared subtab shell in the inspected code. Other areas show good patterns to borrow:

- `InsightsMainLayout` uses `MemberNavbar`, then `SecondaryNav`, then `Outlet`.
- `SecondaryNav` is route-driven with `NavLink`.
- `PageTabs` in the component library wraps Radix tabs for in-page tabs.
- `SessionResultsLayout` uses nested routes for a focused two-step flow: `review` and `facilitate`.

For Team DNA, prefer route-driven subtabs if the product direction is "Team tab with subtabs." Use in-page tabs only for local content that should not be URL-addressable.

### Recommended Team DNA IA path

If the Team subtab shell exists or is being introduced:

```txt
/member/team-tooling/overview
/member/team-tooling/team-pulse
/member/team-tooling/team-dna
```

Add Team DNA as one sibling subtab. It should not be buried inside Team Pulse.

If no subtab shell exists yet, add Team DNA as a route under `TeamToolingRouter` and let `TeamToolingHome` link to it:

```tsx
<Route path="/team-dna" element={<TeamDnaPage />} />
```

Then add a route constant:

```ts
teamDna: '/member/team-tooling/team-dna'
```

This keeps the route portable when the larger subtab shell lands.

### Layout advice for Team DNA

Use the existing Team Tooling shell:

- `MemberNavbar` stays at the top.
- The Team DNA page owns its own scroll area.
- The page should be `flex-1 overflow-y-auto`.
- Avoid adding a second app shell, sidebar, or top nav inside the feature.

Suggested page skeleton:

```tsx
<main className="flex-1 overflow-y-auto bg-background">
  <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
    <TeamDnaExperience />
  </div>
</main>
```

This is intentionally boring around the edges so the Team DNA interaction itself can be special.

## 3. AI patterns in the monolith

There are two major AI patterns to understand.

### Pattern A: Lighthouse / Grow Chat

This is the full conversational AI system.

Important React files:

- `ux/apps/react-platform/src/lighthouse/LighthouseRouter.tsx`
- `ux/apps/react-platform/src/lighthouse/standalone/routes/ChatRouter.tsx`
- `ux/apps/react-platform/src/lighthouse/standalone/routes/AiCoaching.tsx`
- `ux/apps/react-platform/src/lighthouse/hooks/useGrowLogic.ts`
- `ux/apps/react-platform/src/lighthouse/hooks/useChatMessageConversation.ts`
- `ux/apps/react-platform/src/lighthouse/standalone/components/MainArea/useChatSocket.ts`
- `ux/apps/react-platform/src/lighthouse/components/AiDisclaimer.tsx`

Routes:

- `/platform/lighthouse/chat`
- `/platform/lighthouse/chat/:chatId`
- `/platform/lighthouse/chat/consent`
- `/platform/lighthouse/chat/history`

`ChatRouter` decides whether to:

- send the user to unavailable state,
- send the user to consent,
- reuse an existing conversation,
- create a new conversation,
- or show a developer blank state.

The chat route is gated by user fields:

- `ai_coaching_active`
- `consent_to_ai_personalization`

New conversations are created through:

```txt
POST /lighthouse/conversations
```

Existing conversations are loaded through:

```txt
GET /lighthouse/conversations/:chatId?include=messages
```

Search params can shape the new conversation:

- `behavior`
- `goal`
- `initial_user_message`
- `initial_system_message`
- `custom_instructions`
- `requested_system_message_type`
- `skip_initial_messages`
- `title`
- `resource_id`
- `activity_id`
- `activity_collection_ids`
- `flavor`

Streaming happens over ActionCable and LiveKit data channels. `useGrowLogic` sends payloads that include:

- `behavior`
- `chat_notes`
- `history`
- `new_user_messages`
- `is_incognito`
- `is_wrapped`
- `resource_id`
- `activity_id`
- `activity_collection_ids`
- `requested_system_message_type`
- `custom_instructions`

The same chat machinery is reused in the coach route:

```txt
/platform/coach/chat
/platform/coach/chat/:chatId
```

`CoachRouter` passes a different nav and different route names into the same `ChatRouter` and `AiCoaching` components. This is a good sign: Lighthouse is designed to be reused by route configuration, not copied.

### Pattern B: generated AI content inside product surfaces

This is more relevant for Team DNA phase one.

Team Pulse is the best example. The frontend does not ask an LLM directly. It receives AI-generated fields and statuses from backend-owned data.

Team Pulse examples:

- `ai_heading`
- `ai_score_blurb`
- `conversation_starters`
- `historical_insights_heading`
- `historical_insights_blurb`
- `insights_generation_status`
- `historical_insights_generation_status`

The UI handles:

- loading while generation is pending or processing,
- polling every few seconds,
- failed states,
- retry,
- feedback on generated content.

Retry uses:

```txt
POST /llm_generation_retries
```

with a body like:

```json
{
  "record_type": "check_in_session_results",
  "record_id": "...",
  "generation_name": "insights"
}
```

or:

```json
{
  "record_type": "check_in_session_results",
  "record_id": "...",
  "generation_name": "historical_insights"
}
```

Feedback uses `TwoLevelFeedback` with product-specific event names.

This gives Team DNA a clean first integration model:

- Backend owns generated Team DNA insight copy.
- Frontend renders it beautifully.
- Frontend handles status/retry/feedback.
- No frontend prompt engineering in the core product surface.

### Coach Replay AI pattern

Coach Replay has a separate chat-session model:

- `GET /coach_replay/session_recordings/:id`
- `PUT /coach_replay/chat_session/:id`
- `DELETE /coach_replay/chat_session/:id`
- `GET /coach_replay/weekly_recap`

It returns structured `chat_session` data with messages and actions. It is useful evidence that BetterUp also supports product-specific AI workflows outside Lighthouse, but it is coach-specific and should not be copied directly into Team DNA.

The portable idea is:

- product-specific AI can be backend-owned,
- the frontend can render structured messages/actions,
- optimistic UI and feedback matter.

### Ember GenAI gate

Older Ember surfaces use:

- `frontend/services/genai.js`
- `<GenaiExperience>`
- `frontend/services/lighthouse.js`
- `frontend/services/lighthouse-chat.js`

`GenaiExperience` is a wrapper that decides disabled, not-allowed, and allowed states based on org/product/user settings. The default user permission flag is `consentToAiPersonalization`.

For new React Team DNA work, do not build in Ember just to use this wrapper. But do preserve the same policy idea:

- Is AI enabled for this user/org/product?
- Has the user consented where consent is required?
- What disabled/not-allowed state should appear?
- What disclaimer needs to be visible?

## 4. AI strategy for Team DNA

### Phase one: generated insight fields, not chat

For the initial Team DNA surface, prefer data fields like:

```ts
interface TeamDnaInsight {
  scope: 'team' | 'person' | 'duo';
  subjectIds: string[];
  label: string;
  title: string;
  superpowerHeading: string;
  superpowerBody: string;
  supportingBlocks: TeamDnaInfoBlock[];
  generationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}
```

That mirrors Team Pulse: the frontend is not generating the insight in the browser. It is rendering product data.

For prototype data, create a mock adapter with the same shape. Later, engineers can replace the adapter with generated API hooks.

For the launchpad, AI can help author the first team/person/duo language offline. Once it enters the prototype, treat it as curated deterministic content data, not live AI. The runtime should not need to call an AI service to render a pair insight.

Keep `supportingBlocks` structurally available, but first render them as empty/skeletal blocks. The real info block content belongs in a later content pass, after the core interaction and view model are proven.

### Phase two: ask about this context

For open-ended questions, the most codebase-aligned first move is to deep-link into Lighthouse/Grow Chat with Team DNA context:

```txt
/platform/lighthouse/chat?behavior=...&title=...&initial_user_message=...&custom_instructions=...
```

This has a real downside: the user leaves the Team DNA surface. That matches your product concern. But it avoids inventing a second AI mechanism.

The better long-term product direction is a contextual Lighthouse layer that can sit over product surfaces and receive a context payload from the current page. Team DNA could then provide:

- selected team/person/duo,
- visible insight,
- trait evidence,
- suggested question,
- source route.

That future pattern should reuse Lighthouse, not compete with it.

### What not to do

Do not build a brand-new frontend-only AI chat for Team DNA.

Do not put prompts, model choice, or protected business logic into the standalone prototype as if the frontend owns AI generation.

Do not make Team DNA depend on chat to be useful. The main insight surface should stand on its own.

Do not confuse "AI helped write the prototype fixture copy" with "the product is using live AI." Those are different claims, and the implementation should make that difference obvious.

## 5. Recommended implementation shape

### Route and ownership

Add route constants near the existing Team Tooling constants:

```ts
teamDna: '/member/team-tooling/team-dna'
```

Add a route under `TeamToolingRouter`:

```tsx
<Route path="/team-dna" element={<TeamDnaPage />} />
```

If a shared Team subtab layout exists by then, mount Team DNA inside that layout. If it does not, keep Team DNA route-ready and let the subtab shell adopt it later.

### File shape

A likely monolith folder shape:

```txt
ux/apps/react-platform/src/member/team-tooling/pages/TeamDna/
  TeamDnaPage.tsx
  TeamDnaExperience.tsx
  components/
    TeamFace.tsx
    TeamFaceField.tsx
    TeamDnaInsightHero.tsx
    TeamDnaInfoBlock.tsx
    TeamDnaInfoGrid.tsx
    TeamDnaDebugPanel.tsx
  data/
    types.ts
    mockTeamDna.ts
    teamDnaAdapter.ts
  hooks/
    useTeamDnaSelection.ts
```

For the standalone launchpad, mirror this shape so porting is boring.

### Component ownership

Keep generic design-system primitives generic. Team DNA behavior should live in Team DNA components.

Good ownership split:

- `TeamDnaPage`: route-level shell, title, data adapter, error/loading.
- `TeamDnaExperience`: layout and selection state wiring.
- `TeamFaceField`: clustered face layout, selection affordance, responsive behavior.
- `TeamFace`: one person's visual button.
- `TeamDnaInsightHero`: team/person/duo superpower blurb.
- `TeamDnaInfoBlock`: supporting content card shell. Keep it empty/skeletal in the first launchpad pass until the real content model is decided.
- `useTeamDnaSelection`: rules for zero, one, or two selected people.

Add short implementation comments where they explain a porting boundary:

- why the shell is thin,
- why the adapter exists,
- why selection is separate from rendering,
- why face cluster styling is local to Team DNA,
- why View 2 can reuse the same lower-level pieces later.

### Motion

Use `motion/react`.

Use one component responding to state rather than duplicating elements for animation. For content transitions, use:

```tsx
<AnimatePresence mode="wait">
  ...
</AnimatePresence>
```

That matches the "fade out before fade in" principle and avoids muddy crossfades.

Use stable IDs for people and selected scopes so motion can preserve continuity.

Respect reduced-motion preferences.

### Data

Use a mock adapter now, not hardcoded component-local data.

Good prototype pattern:

```ts
const teamDna = await getTeamDna({ teamId });
```

where `getTeamDna` is currently mock-backed but shaped like a future API call.

Future monolith pattern should use generated API hooks from:

```txt
@betterup/api/src/member/@tanstack/react-query.gen
```

when backend endpoints exist.

### Analytics and i18n

Team Tooling pages already define page names and use:

- `BrowserTitle`
- `useTranslate`
- `useAnalytics`
- `buttonEvent`
- `pageEvent`

Team DNA should follow that pattern when ported.

For the standalone launchpad, keep copy local if faster, but structure it so translation keys are easy to introduce.

## 6. View 1 strategy in monolith terms

The current phase-one direction is View 1: clustered team on the left, insight/content on the right.

Desktop:

- Left: clustered team face field.
- Right: insight hero and info blocks.
- No selection: team state.
- One selected: person state.
- Two selected: duo state.

Mobile:

- Stack the face field above the insight.
- Keep selected state obvious.
- Watch the large-team edge case carefully.

Known responsive risk:

If a team has many members, a tall mobile face cluster may force the user to scroll back up repeatedly to change selection. For phase one, design for the normal 3-12 person range, but document a future mitigation:

- sticky compact selected-person strip,
- collapsed cluster after selection,
- or View 2 horizontal rail as the mobile-forward alternative.

Because Rahul alignment now favors View 1 first, do not build View 2 yet. Keep the data and `TeamFace` component reusable so View 2 can arrive later without rewriting the insight/content model.

Treat View 2 as the likely future mobile pass, not just a decorative alternate view. If View 1 proves the idea but feels too tall on mobile, the horizontal focus rail can become the mobile-forward layout: selected people stay reachable, the selected person or duo can center itself, and the insight content can stay in a simple vertical stack.

That future path only works cleanly if phase one keeps these pieces reusable:

- `TeamFace`
- `TeamDnaInsightHero`
- `TeamDnaInfoBlock`
- `useTeamDnaSelection`
- the adapter/view-model shape

## 7. Open questions

1. Does the real product route become `/member/team-tooling/team-dna`, or will Product create a broader `/member/team` shell with `overview`, `team-pulse`, and `team-dna` subtabs?

2. What exact backend object owns Team DNA data: a team, a reporting group, a manager's team, a Team DNA assessment result, or something else?

3. Does the Team DNA backend return only individual Big Five-style traits, or does it also return team-level and duo-level generated insights?

4. For the final product, should duo insights be precomputed, generated on demand, or derived deterministically from trait combinations?

5. Which AI consent/disclaimer rules apply to Team DNA generated insights if the insight is generated before the user opens the page?

6. Should the first monolith implementation deep-link to Lighthouse for questions, or wait until a contextual AI overlay exists?

7. Should Team DNA adopt the `2026`/`uplift` theme exactly, or will the design-system team bless a slightly warmer Team DNA surface token?

8. Is View 2 the preferred mobile solution after View 1 proves the core experience?

9. What real content should fill the info blocks in the later content pass?

10. Does component-library have stable public exports coming, or is direct `src/components/ui/...` importing still the accepted local pattern?

## Bottom line

Build Team DNA like a real Team Tooling React page from the start.

Use the modern component library and tokens. Let Team DNA own its new face-cluster interaction. Keep first-pass info blocks skeletal. Treat AI-assisted fixture copy as curated content, not live AI. Use Lighthouse only when the product needs open-ended conversation. Keep View 1 focused and portable, with a route/data/component shape that can drop into the monolith with minimal drama. Treat View 2 as the likely later mobile pass.
